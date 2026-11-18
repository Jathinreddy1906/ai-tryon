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
