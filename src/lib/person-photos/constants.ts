export const PERSON_PHOTO_BUCKET = "person-photos";
export const MAX_PERSON_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PERSON_PHOTO_DIMENSION = 8192;
export const MAX_PERSON_PHOTO_PIXELS = 40_000_000;
export const MIN_PERSON_PHOTO_DIMENSION = 256;
export const MAX_PROCESSED_PHOTO_DIMENSION = 2048;
export const PERSON_PHOTO_SIGNED_URL_SECONDS = 600;

export const PERSON_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
