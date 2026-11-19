import { z } from "zod";

export const personPhotoSchema = z.object({
  id: z.string().uuid(),
  signedUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  byteSize: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});

export const personPhotoResponseSchema = z.object({
  photo: personPhotoSchema.nullable(),
  warning: z.string().optional(),
  error: z.string().optional(),
});

export type PersonPhoto = z.infer<typeof personPhotoSchema>;
export type PersonPhotoResponse = z.infer<typeof personPhotoResponseSchema>;

export const poseReadinessResponseSchema = z.object({
  ready: z.boolean(),
  status: z.enum(["ready", "not_ready", "unavailable"]),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  inferenceEnabled: z.literal(false),
});

export type PoseReadinessResponse = z.infer<typeof poseReadinessResponseSchema>;

export const tryOnStatusSchema = z.enum([
  "starting",
  "in_queue",
  "processing",
  "completed",
  "failed",
  "expired",
]);

export const tryOnStartRequestSchema = z.object({
  productSlug: z.string().min(1).max(120),
  adultAttestation: z.literal(true),
  ownPhotoAttestation: z.literal(true),
  fashnProcessingConsent: z.literal(true),
});

export const tryOnStartResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: tryOnStatusSchema,
});

export const tryOnStatusResponseSchema = z.object({
  status: tryOnStatusSchema,
  outputImage: z.string().regex(/^data:image\/(?:jpeg|png);base64,/).optional(),
  error: z.string().optional(),
});
