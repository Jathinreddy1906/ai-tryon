import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPersonPhotoAccess,
  photoApiError,
} from "@/lib/person-photos/server-auth";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const providerStatusSchema = z.object({
  status: z.enum(["starting", "in_queue", "processing", "completed", "failed"]),
  output: z.array(z.string()).optional(),
});
const MAX_OUTPUT_DATA_URI_LENGTH = 24 * 1024 * 1024;
const OUTPUT_EXPIRY_MS = 55 * 60 * 1000;

type StatusRouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: StatusRouteContext,
) {
  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  const { jobId } = await params;
  if (!z.string().uuid().safeParse(jobId).success) {
    return photoApiError("The try-on job could not be found.", 404);
  }

  const { data: job, error: jobError } = await access.admin
    .from("try_on_jobs")
    .select("provider_prediction_id, status, created_at")
    .eq("id", jobId)
    .eq("user_id", access.userId)
    .maybeSingle();
  if (jobError) {
    console.error("Could not load a try-on job.");
    return photoApiError("The try-on status could not be loaded.", 500);
  }
  if (!job) return photoApiError("The try-on job could not be found.", 404);

  if (job.status === "failed" || job.status === "expired") {
    return statusResponse(job.status, "This try-on result is no longer available.");
  }
  if (Date.now() - Date.parse(job.created_at) > OUTPUT_EXPIRY_MS) {
    await updateTryOnJob(access.admin, jobId, access.userId, "expired");
    return statusResponse("expired", "The try-on result expired. Start a new try-on to continue.");
  }

  const apiKey = process.env.FASHN_API_KEY?.trim();
  if (!apiKey || !job.provider_prediction_id) {
    return statusResponse(job.status, undefined, 202);
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch(
      `https://api.fashn.ai/v1/status/${encodeURIComponent(job.provider_prediction_id)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return photoApiError("The try-on service could not be reached.", 502);
  }
  if (!providerResponse.ok) {
    return photoApiError("The try-on status could not be retrieved.", 502);
  }

  let payload: unknown;
  try {
    payload = await providerResponse.json();
  } catch {
    return photoApiError("The try-on service returned an unreadable status.", 502);
  }
  const parsed = providerStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return photoApiError("The try-on service returned an invalid status.", 502);
  }

  if (parsed.data.status === "failed") {
    await updateTryOnJob(access.admin, jobId, access.userId, "failed");
    return statusResponse("failed", "The try-on could not be generated. No result was saved.");
  }

  if (parsed.data.status !== "completed") {
    await updateTryOnJob(access.admin, jobId, access.userId, parsed.data.status);
    return statusResponse(parsed.data.status, undefined, 202);
  }

  const outputImage = parsed.data.output?.[0];
  if (!outputImage || outputImage === "_expired") {
    await updateTryOnJob(access.admin, jobId, access.userId, "expired");
    return statusResponse("expired", "The try-on result expired. Start a new try-on to continue.");
  }
  if (
    outputImage.length > MAX_OUTPUT_DATA_URI_LENGTH ||
    !/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(outputImage)
  ) {
    return photoApiError("The try-on service returned an invalid image.", 502);
  }

  await updateTryOnJob(access.admin, jobId, access.userId, "completed");
  return NextResponse.json(
    { status: "completed", outputImage },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

function statusResponse(
  status: "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired",
  error?: string,
  httpStatus = 200,
) {
  return NextResponse.json(
    { status, ...(error ? { error } : {}) },
    { status: httpStatus, headers: { "Cache-Control": "private, no-store" } },
  );
}

async function updateTryOnJob(
  admin: SupabaseClient<Database>,
  jobId: string,
  userId: string,
  status: "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired",
) {
  const { error } = await admin
    .from("try_on_jobs")
    .update({ status })
    .eq("id", jobId)
    .eq("user_id", userId);
  if (error) console.error("Could not update try-on job status.", error);
}
