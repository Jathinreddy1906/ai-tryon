import { Buffer } from "node:buffer";
import sharp, { type Metadata } from "sharp";
import {
  MAX_PERSON_PHOTO_BYTES,
  MAX_PERSON_PHOTO_DIMENSION,
  MAX_PERSON_PHOTO_PIXELS,
  MAX_PROCESSED_PHOTO_DIMENSION,
  MIN_PERSON_PHOTO_DIMENSION,
} from "./constants";

const mimeByFormat: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const mimeAliases: Record<string, string> = {
  "image/jpg": "image/jpeg",
};

export type PhotoProcessingResult =
  | {
      ok: true;
      buffer: Buffer;
      width: number;
      height: number;
    }
  | {
      ok: false;
      status: 400 | 413 | 415;
      message: string;
    };

export async function preprocessPersonPhoto(file: File): Promise<PhotoProcessingResult> {
  if (file.size === 0) {
    return { ok: false, status: 400, message: "The selected image is empty." };
  }
  if (file.size > MAX_PERSON_PHOTO_BYTES) {
    return { ok: false, status: 413, message: "Choose an image that is 10 MB or smaller." };
  }

  const declaredType = mimeAliases[file.type.toLowerCase()] ?? file.type.toLowerCase();
  if (declaredType && !Object.values(mimeByFormat).includes(declaredType)) {
    return {
      ok: false,
      status: 415,
      message: "Choose a JPG, PNG, or WebP image.",
    };
  }

  const input = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_PERSON_PHOTO_PIXELS,
    }).metadata();
  } catch {
    return {
      ok: false,
      status: 400,
      message: "This image could not be decoded. Choose a valid JPG, PNG, or WebP file.",
    };
  }

  const actualType = metadata.format ? mimeByFormat[metadata.format] : undefined;
  if (!actualType) {
    return {
      ok: false,
      status: 415,
      message: "Choose a JPG, PNG, or WebP image.",
    };
  }
  if (declaredType && declaredType !== actualType) {
    return {
      ok: false,
      status: 415,
      message: "The file type does not match the image content.",
    };
  }
  if ((metadata.pages ?? 1) > 1) {
    return {
      ok: false,
      status: 415,
      message: "Animated images are not supported. Choose a still photo.",
    };
  }

  const { width, height } = metadata;
  if (!width || !height) {
    return {
      ok: false,
      status: 400,
      message: "The image dimensions could not be read.",
    };
  }
  if (
    width < MIN_PERSON_PHOTO_DIMENSION ||
    height < MIN_PERSON_PHOTO_DIMENSION
  ) {
    return {
      ok: false,
      status: 400,
      message: "Use a photo that is at least 256 pixels wide and tall.",
    };
  }
  if (
    width > MAX_PERSON_PHOTO_DIMENSION ||
    height > MAX_PERSON_PHOTO_DIMENSION ||
    width * height > MAX_PERSON_PHOTO_PIXELS
  ) {
    return {
      ok: false,
      status: 413,
      message: "The image dimensions are too large. Choose a photo up to 8192 pixels per side.",
    };
  }

  let processed: Awaited<
    ReturnType<ReturnType<typeof sharp>["toBuffer"]>
  >;
  try {
    processed = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_PERSON_PHOTO_PIXELS,
    })
      .rotate()
      .resize({
        width: MAX_PROCESSED_PHOTO_DIMENSION,
        height: MAX_PROCESSED_PHOTO_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return {
      ok: false,
      status: 400,
      message: "This image could not be processed. Choose another photo and try again.",
    };
  }

  const output = processed.data;
  const outputWidth = processed.info.width;
  const outputHeight = processed.info.height;
  if (output.length > MAX_PERSON_PHOTO_BYTES) {
    return {
      ok: false,
      status: 413,
      message: "The processed image is still larger than 10 MB.",
    };
  }
  if (
    outputWidth < MIN_PERSON_PHOTO_DIMENSION ||
    outputHeight < MIN_PERSON_PHOTO_DIMENSION
  ) {
    return {
      ok: false,
      status: 400,
      message: "The crop is too narrow. Choose a less extreme crop and try again.",
    };
  }

  return {
    ok: true,
    buffer: output,
    width: outputWidth,
    height: outputHeight,
  };
}
