import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCatalogData } from "@/lib/catalog.server";
import { MAX_PERSON_PHOTO_BYTES, PERSON_PHOTO_BUCKET } from "@/lib/person-photos/constants";
import { tryOnStartRequestSchema } from "@/lib/person-photos/contracts";
import {
  getPersonPhotoAccess,
  isSameOriginRequest,
  photoApiError,
} from "@/lib/person-photos/server-auth";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const CONSENT_VERSION = "fashn-v1.6-2026-11-19";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return photoApiError("This try-on request could not be verified.", 403);
  }

  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  if (process.env.TRYVORA_AI_TRYON_ENABLED !== "true") {
    return photoApiError("AI try-on is not enabled for this deployment.", 503);
  }

  const apiKey = process.env.FASHN_API_KEY?.trim();
  if (!apiKey) {
    return photoApiError("The try-on service is not configured.", 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return photoApiError("The try-on request is invalid.", 400);
  }
  const parsedRequest = tryOnStartRequestSchema.safeParse(payload);
  if (!parsedRequest.success) {
    return photoApiError("Confirm the photo-use requirements before continuing.", 400);
  }

  const catalog = await getCatalogData();
  if (catalog.mode !== "database") {
    return photoApiError("Try-on is available only for verified live catalogue items.", 503);
  }
  const product = catalog.products.find(
    (item) => item.slug === parsedRequest.data.productSlug,
  );
  if (!product || product.isSample || product.tryOnEligible !== true) {
    return photoApiError("Choose a published catalogue item approved for try-on.", 404);
  }

  let garmentImageUrl: URL;
  try {
    garmentImageUrl = new URL(product.image);
  } catch {
    return photoApiError("This catalogue item does not have a usable image.", 400);
  }
  if (garmentImageUrl.protocol !== "https:") {
    return photoApiError("Catalogue images must use secure HTTPS URLs.", 400);
  }

  const { data: photo, error: photoError } = await access.admin
    .from("person_photos")
    .select("id, object_path, byte_size")
    .eq("user_id", access.userId)
    .maybeSingle();
  if (photoError) {
    console.error("Could not load a user's private photo for try-on.");
    return photoApiError("Your private photo could not be loaded.", 500);
  }
  if (!photo) {
    return photoApiError("Save your own private photo before starting a try-on.", 400);
  }

  const { data: personPhoto, error: downloadError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .download(photo.object_path);
  if (downloadError || !personPhoto) {
    console.error("Could not retrieve a user's private photo for try-on.");
    return photoApiError("Your private photo could not be opened.", 502);
  }
  if (photo.byte_size > MAX_PERSON_PHOTO_BYTES) {
    return photoApiError("Your saved photo exceeds the supported size.", 413);
  }

  const userPhotoBytes = Buffer.from(await personPhoto.arrayBuffer());
  if (!userPhotoBytes.length || userPhotoBytes.length > MAX_PERSON_PHOTO_BYTES) {
    return photoApiError("Your saved photo is invalid or too large.", 413);
  }

  const { data: jobId, error: jobError } = await access.admin.rpc(
    "create_try_on_job",
    {
      p_user_id: access.userId,
      p_product_slug: product.slug,
      p_consent_version: CONSENT_VERSION,
    },
  );
  if (jobError || !jobId) {
    const message = jobError?.message ?? "";
    if (message.includes("TRY_ON_ALREADY_ACTIVE")) {
      return photoApiError("Wait for your current try-on to finish before starting another.", 429);
    }
    if (message.includes("TRY_ON_DAILY_LIMIT")) {
      return photoApiError("You have reached the limit of three try-ons in 24 hours.", 429);
    }
    console.error("Could not create a try-on job.", jobError);
    return photoApiError("A try-on could not be started. Please try again.", 500);
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "tryon-v1.6",
        inputs: {
          model_image: `data:image/jpeg;base64,${userPhotoBytes.toString("base64")}`,
          garment_image: product.image,
          category: mapGarmentCategory(product.categorySlug),
          mode: "performance",
          output_format: "jpeg",
          return_base64: true,
          num_samples: 1,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    await markTryOnJobFailed(access.admin, jobId, access.userId);
    return photoApiError("The try-on service could not be reached. Please try again later.", 502);
  }

  let providerPayload: unknown;
  try {
    providerPayload = await providerResponse.json();
  } catch {
    await markTryOnJobFailed(access.admin, jobId, access.userId);
    return photoApiError("The try-on service returned an unreadable response.", 502);
  }

  const predictionId =
    typeof providerPayload === "object" &&
    providerPayload !== null &&
    "id" in providerPayload &&
    typeof providerPayload.id === "string" &&
    providerPayload.id.length > 0 &&
    providerPayload.id.length <= 200
      ? providerPayload.id
      : null;

  if (!providerResponse.ok || !predictionId) {
    await markTryOnJobFailed(access.admin, jobId, access.userId);
    const status = providerResponse.status === 429 ? 429 : 502;
    return photoApiError(
      status === 429
        ? "The try-on service is busy or out of credits. Please try again later."
        : "The try-on service could not start a generation.",
      status,
    );
  }

  const { error: updateError } = await access.admin
    .from("try_on_jobs")
    .update({
      provider_prediction_id: predictionId,
      status: "in_queue",
    })
    .eq("id", jobId)
    .eq("user_id", access.userId);
  if (updateError) {
    console.error("Could not attach the provider prediction to the try-on job.", updateError);
    return photoApiError("The try-on started but its status could not be saved.", 500);
  }

  return NextResponse.json({ jobId, status: "in_queue" }, { status: 202 });
}

function mapGarmentCategory(categorySlug: string) {
  if (["trousers", "jeans"].includes(categorySlug)) return "bottoms";
  if (categorySlug === "dresses") return "one-pieces";
  if (["shirts", "t-shirts", "jackets", "formal-wear", "casual-wear"].includes(categorySlug)) {
    return "tops";
  }
  return "auto";
}

async function markTryOnJobFailed(
  admin: SupabaseClient<Database>,
  jobId: string,
  userId: string,
) {
  const { error } = await admin
    .from("try_on_jobs")
    .update({ status: "failed" })
    .eq("id", jobId)
    .eq("user_id", userId);
  if (error) console.error("Could not mark a failed try-on job.", error);
}
