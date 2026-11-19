import { NextResponse, type NextRequest } from "next/server";
import { poseReadinessResponseSchema } from "@/lib/person-photos/contracts";
import {
  getPersonPhotoAccess,
  isSameOriginRequest,
  photoApiError,
} from "@/lib/person-photos/server-auth";
import { PERSON_PHOTO_BUCKET } from "@/lib/person-photos/constants";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return photoApiError("This readiness request could not be verified.", 403);
  }

  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  const { data: photo, error } = await access.admin
    .from("person_photos")
    .select("object_path")
    .eq("user_id", access.userId)
    .maybeSingle();
  if (error) {
    console.error("Could not load private photo for pose readiness.", error);
    return photoApiError("Your photo could not be checked. Please try again.", 500);
  }
  if (!photo) {
    return photoApiError("Save a private photo before checking pose readiness.", 400);
  }

  const { data: signedUrl, error: signedUrlError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .createSignedUrl(photo.object_path, 60);
  if (signedUrlError || !signedUrl.signedUrl) {
    console.error("Could not open private photo for pose readiness.", signedUrlError);
    return photoApiError("Your private photo could not be opened. Please try again.", 500);
  }

  const serviceUrl = process.env.TRYVORA_POSE_SERVICE_URL?.trim();
  if (!serviceUrl) {
    return photoApiError("The pose preparation service is not configured.", 503);
  }

  let photoResponse: Response;
  try {
    photoResponse = await fetch(signedUrl.signedUrl, { cache: "no-store" });
  } catch {
    return photoApiError("Your private photo could not be retrieved.", 502);
  }
  if (!photoResponse.ok) {
    return photoApiError("Your private photo could not be retrieved.", 502);
  }

  const photoBytes = await photoResponse.arrayBuffer();
  const photoBlob = new Blob([photoBytes], { type: "image/jpeg" });
  const formData = new FormData();
  formData.set("file", photoBlob, "person-photo.jpg");

  let endpoint: URL;
  try {
    endpoint = new URL("/v1/pose/readiness", serviceUrl);
  } catch {
    return photoApiError("The pose preparation service URL is invalid.", 503);
  }

  const serviceKey = process.env.TRYVORA_POSE_SERVICE_KEY?.trim();
  if (!serviceKey) {
    return photoApiError("The pose preparation service key is not configured.", 503);
  }
  let serviceResponse: Response;
  try {
    serviceResponse = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { "x-tryvora-key": serviceKey },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return photoApiError("The pose preparation service is unavailable.", 502);
  }

  let payload: unknown;
  try {
    payload = await serviceResponse.json();
  } catch {
    return photoApiError("The pose preparation service returned an unreadable response.", 502);
  }

  const parsed = poseReadinessResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return photoApiError("The pose preparation service returned an invalid response.", 502);
  }
  if (!serviceResponse.ok) {
    return NextResponse.json(parsed.data, { status: serviceResponse.status });
  }
  return NextResponse.json(parsed.data);
}
