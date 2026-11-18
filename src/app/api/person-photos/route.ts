import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_PERSON_PHOTO_BYTES,
  PERSON_PHOTO_BUCKET,
  PERSON_PHOTO_SIGNED_URL_SECONDS,
} from "@/lib/person-photos/constants";
import {
  getPersonPhotoAccess,
  isSameOriginRequest,
  photoApiError,
} from "@/lib/person-photos/server-auth";
import { preprocessPersonPhoto } from "@/lib/person-photos/preprocess.server";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

export async function GET() {
  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  const { data: photo, error } = await access.admin
    .from("person_photos")
    .select("id, object_path, byte_size, width, height, updated_at")
    .eq("user_id", access.userId)
    .maybeSingle();

  if (error) {
    console.error("Could not load a user's private photo.", error);
    return photoApiError("Your saved photo could not be loaded. Please try again.", 500);
  }
  if (!photo) return NextResponse.json({ photo: null });

  const { data: signedUrl, error: signedUrlError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .createSignedUrl(photo.object_path, PERSON_PHOTO_SIGNED_URL_SECONDS);

  if (signedUrlError) {
    console.error("Could not sign a private photo URL.", signedUrlError);
    return photoApiError("Your saved photo could not be opened. Please try again.", 500);
  }

  return NextResponse.json({
    photo: {
      id: photo.id,
      signedUrl: signedUrl.signedUrl,
      width: photo.width,
      height: photo.height,
      byteSize: photo.byte_size,
      updatedAt: photo.updated_at,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return photoApiError("This upload request could not be verified.", 403);
  }

  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_PERSON_PHOTO_BYTES + 64 * 1024
  ) {
    return photoApiError("Choose an image smaller than 10 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return photoApiError("Choose a valid image file and try again.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return photoApiError("Choose a JPG, PNG, or WebP image.", 400);
  }

  const processed = await preprocessPersonPhoto(file);
  if (!processed.ok) return photoApiError(processed.message, processed.status);

  const { data: existingPhoto, error: existingPhotoError } = await access.admin
    .from("person_photos")
    .select("object_path")
    .eq("user_id", access.userId)
    .maybeSingle();

  if (existingPhotoError) {
    console.error("Could not read the previous private photo record.", existingPhotoError);
    return photoApiError("Your previous photo could not be replaced. Please try again.", 500);
  }

  const objectPath = `${access.userId}/${randomUUID()}.jpg`;
  const { error: uploadError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .upload(objectPath, processed.buffer, {
      cacheControl: "0",
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Could not store a processed private photo.", uploadError);
    return photoApiError("Your photo could not be saved. Please try again.", 502);
  }

  const { data: signedUrl, error: signedUrlError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .createSignedUrl(objectPath, PERSON_PHOTO_SIGNED_URL_SECONDS);

  if (signedUrlError) {
    console.error("Could not sign a newly stored private photo.", signedUrlError);
    await removeUnrecordedPhoto(access.admin, objectPath);
    return photoApiError("Your photo could not be opened after upload. Please try again.", 502);
  }

  const { data: savedPhoto, error: saveError } = await access.admin
    .from("person_photos")
    .upsert(
      {
        user_id: access.userId,
        object_path: objectPath,
        content_type: "image/jpeg",
        byte_size: processed.buffer.length,
        width: processed.width,
        height: processed.height,
      },
      { onConflict: "user_id" },
    )
    .select("id, byte_size, width, height, updated_at")
    .single();

  if (saveError) {
    console.error("Could not save private photo metadata.", saveError);
    await removeUnrecordedPhoto(access.admin, objectPath);
    return photoApiError("Your photo could not be saved. Please try again.", 500);
  }

  let warning: string | undefined;
  if (
    existingPhoto &&
    existingPhoto.object_path !== objectPath
  ) {
    const { error: oldPhotoRemovalError } = await access.admin.storage
      .from(PERSON_PHOTO_BUCKET)
      .remove([existingPhoto.object_path]);
    if (oldPhotoRemovalError) {
      console.error("Could not remove a replaced private photo.", oldPhotoRemovalError);
      warning = "Your new photo is saved, but the previous file could not be removed.";
    }
  }

  return NextResponse.json(
    {
      photo: {
        id: savedPhoto.id,
        signedUrl: signedUrl.signedUrl,
        width: savedPhoto.width,
        height: savedPhoto.height,
        byteSize: savedPhoto.byte_size,
        updatedAt: savedPhoto.updated_at,
      },
      ...(warning ? { warning } : {}),
    },
    { status: existingPhoto ? 200 : 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return photoApiError("This delete request could not be verified.", 403);
  }

  const access = await getPersonPhotoAccess();
  if (!access.ok) return access.response;

  const { data: photo, error: photoError } = await access.admin
    .from("person_photos")
    .select("id, object_path")
    .eq("user_id", access.userId)
    .maybeSingle();

  if (photoError) {
    console.error("Could not read the private photo before deletion.", photoError);
    return photoApiError("Your photo could not be deleted. Please try again.", 500);
  }
  if (!photo) return NextResponse.json({ photo: null });

  const { error: storageError } = await access.admin.storage
    .from(PERSON_PHOTO_BUCKET)
    .remove([photo.object_path]);
  if (storageError) {
    console.error("Could not remove a private photo object.", storageError);
    return photoApiError("Your photo file could not be deleted. Please try again.", 502);
  }

  const { error: recordError } = await access.admin
    .from("person_photos")
    .delete()
    .eq("id", photo.id)
    .eq("user_id", access.userId);

  if (recordError) {
    console.error("Could not remove private photo metadata.", recordError);
    return photoApiError(
      "The photo file was removed, but its record needs attention. Refresh this page.",
      500,
    );
  }

  return NextResponse.json({ photo: null });
}

async function removeUnrecordedPhoto(
  admin: SupabaseClient<Database>,
  objectPath: string,
) {
  const { error } = await admin.storage.from(PERSON_PHOTO_BUCKET).remove([objectPath]);
  if (error) console.error("Could not clean up an unrecorded private photo.", error);
}
