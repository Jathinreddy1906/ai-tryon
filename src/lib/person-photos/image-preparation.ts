import {
  MAX_PERSON_PHOTO_BYTES,
  MAX_PERSON_PHOTO_DIMENSION,
  MAX_PERSON_PHOTO_PIXELS,
  MAX_PROCESSED_PHOTO_DIMENSION,
  MIN_PERSON_PHOTO_DIMENSION,
  PERSON_PHOTO_MIME_TYPES,
} from "@/lib/person-photos/constants";

export type PhotoCrop = "full" | "square" | "portrait";

const allowedMimeTypes = new Set<string>(PERSON_PHOTO_MIME_TYPES);
const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export async function validatePhotoFile(file: File): Promise<string | null> {
  if (!file.size) return "The selected image is empty.";
  if (file.size > MAX_PERSON_PHOTO_BYTES) {
    return "Choose an image that is 10 MB or smaller.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    (file.type && !allowedMimeTypes.has(file.type.toLowerCase())) ||
    (!file.type && !allowedExtensions.has(extension))
  ) {
    return "Choose a JPG, PNG, or WebP image.";
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return "This image could not be opened. Choose a valid JPG, PNG, or WebP photo.";
  }

  const { width, height } = bitmap;
  bitmap.close();

  if (
    width < MIN_PERSON_PHOTO_DIMENSION ||
    height < MIN_PERSON_PHOTO_DIMENSION
  ) {
    return "Use a photo that is at least 256 pixels wide and tall.";
  }
  if (
    width > MAX_PERSON_PHOTO_DIMENSION ||
    height > MAX_PERSON_PHOTO_DIMENSION ||
    width * height > MAX_PERSON_PHOTO_PIXELS
  ) {
    return "The image dimensions are too large. Choose a photo up to 8192 pixels per side.";
  }

  return null;
}

export async function preparePhotoForUpload(
  file: File,
  rotationDegrees: number,
  crop: PhotoCrop,
): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(
      1,
      MAX_PROCESSED_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const sourceWidth = Math.max(1, Math.round(bitmap.width * scale));
    const sourceHeight = Math.max(1, Math.round(bitmap.height * scale));
    const rotation = ((rotationDegrees % 360) + 360) % 360;
    const quarterTurn = rotation === 90 || rotation === 270;
    const rotatedWidth = quarterTurn ? sourceHeight : sourceWidth;
    const rotatedHeight = quarterTurn ? sourceWidth : sourceHeight;
    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = rotatedWidth;
    rotatedCanvas.height = rotatedHeight;

    const rotatedContext = rotatedCanvas.getContext("2d");
    if (!rotatedContext) throw new Error("Image preview is unavailable in this browser.");
    rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
    rotatedContext.rotate((rotation * Math.PI) / 180);
    rotatedContext.drawImage(
      bitmap,
      -sourceWidth / 2,
      -sourceHeight / 2,
      sourceWidth,
      sourceHeight,
    );

    const cropBounds = getCropBounds(rotatedWidth, rotatedHeight, crop);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = cropBounds.width;
    outputCanvas.height = cropBounds.height;
    const outputContext = outputCanvas.getContext("2d");
    if (!outputContext) throw new Error("Image preview is unavailable in this browser.");
    outputContext.fillStyle = "#ffffff";
    outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputContext.drawImage(
      rotatedCanvas,
      cropBounds.x,
      cropBounds.y,
      cropBounds.width,
      cropBounds.height,
      0,
      0,
      cropBounds.width,
      cropBounds.height,
    );

    const blob = await canvasToJpeg(outputCanvas);
    return new File([blob], "person-photo.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

function getCropBounds(width: number, height: number, crop: PhotoCrop) {
  if (crop === "full") return { x: 0, y: 0, width, height };

  const targetRatio = crop === "square" ? 1 : 4 / 5;
  const sourceRatio = width / height;
  const cropWidth =
    sourceRatio > targetRatio ? Math.round(height * targetRatio) : width;
  const cropHeight =
    sourceRatio > targetRatio ? height : Math.round(width / targetRatio);

  return {
    x: Math.floor((width - cropWidth) / 2),
    y: Math.floor((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("The photo could not be prepared for upload."));
      },
      "image/jpeg",
      0.92,
    );
  });
}
