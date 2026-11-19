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
