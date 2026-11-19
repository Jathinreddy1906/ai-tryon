import { describe, expect, it } from "vitest";
import {
  tryOnStartRequestSchema,
  tryOnStatusResponseSchema,
} from "./contracts";

describe("tryOnStatusResponseSchema", () => {
  it("accepts an ephemeral base64 image result", () => {
    expect(
      tryOnStatusResponseSchema.safeParse({
        status: "completed",
        outputImage: "data:image/jpeg;base64,SGVsbG8=",
      }).success,
    ).toBe(true);
  });

  it("rejects a remote image URL as a generated result", () => {
    expect(
      tryOnStatusResponseSchema.safeParse({
        status: "completed",
        outputImage: "https://cdn.fashn.ai/result.jpg",
      }).success,
    ).toBe(false);
  });
});

describe("tryOnStartRequestSchema", () => {
  it("requires adult, own-photo, and provider-processing attestations", () => {
    const request = {
      productSlug: "licensed-shirt",
      adultAttestation: true,
      ownPhotoAttestation: true,
      fashnProcessingConsent: true,
    };
    expect(tryOnStartRequestSchema.safeParse(request).success).toBe(true);
    expect(
      tryOnStartRequestSchema.safeParse({ ...request, ownPhotoAttestation: false }).success,
    ).toBe(false);
  });
});
