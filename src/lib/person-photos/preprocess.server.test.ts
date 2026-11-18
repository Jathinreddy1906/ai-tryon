import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MAX_PERSON_PHOTO_BYTES } from "./constants";
import { preprocessPersonPhoto } from "./preprocess.server";

async function createImage(
  width: number,
  height: number,
  format: "png" | "jpeg" | "webp" = "png",
) {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 80, g: 100, b: 120 },
    },
  });
  if (format === "jpeg") return image.jpeg().toBuffer();
  if (format === "webp") return image.webp().toBuffer();
  return image.png().toBuffer();
}

function imageFile(buffer: Buffer, name: string, type: string) {
  return new File([new Uint8Array(buffer)], name, { type });
}

describe("preprocessPersonPhoto", () => {
  it("normalizes a valid PNG to a bounded JPEG", async () => {
    const source = await createImage(640, 480);
    const result = await preprocessPersonPhoto(imageFile(source, "photo.png", "image/png"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
    expect(result.buffer.length).toBeLessThan(MAX_PERSON_PHOTO_BYTES);
  });

  it("rejects an unsupported type and a declared/content type mismatch", async () => {
    const png = await createImage(320, 320);

    const unsupported = await preprocessPersonPhoto(
      imageFile(png, "photo.gif", "image/gif"),
    );
    const mismatch = await preprocessPersonPhoto(
      imageFile(png, "photo.jpg", "image/jpeg"),
    );

    expect(unsupported).toMatchObject({ ok: false, status: 415 });
    expect(mismatch).toMatchObject({ ok: false, status: 415 });
  });

  it("rejects corrupt image data", async () => {
    const result = await preprocessPersonPhoto(
      new File(["not an image"], "photo.png", { type: "image/png" }),
    );

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects files that exceed the input byte limit", async () => {
    const oversized = new File(
      [new Uint8Array(MAX_PERSON_PHOTO_BYTES + 1)],
      "photo.jpg",
      { type: "image/jpeg" },
    );
    const result = await preprocessPersonPhoto(oversized);

    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects images outside the dimension bounds", async () => {
    const tooSmall = await createImage(255, 320);
    const tooWide = await createImage(8193, 256);
    const smallResult = await preprocessPersonPhoto(
      imageFile(tooSmall, "small.png", "image/png"),
    );
    const wideResult = await preprocessPersonPhoto(
      imageFile(tooWide, "wide.png", "image/png"),
    );

    expect(smallResult).toMatchObject({ ok: false, status: 400 });
    expect(wideResult).toMatchObject({ ok: false, status: 413 });
  });
});
