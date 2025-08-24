import { z } from "zod";

export const createLinkPayloadSchema = z.object({
  url: z.url(),
  description: z.string().min(2).max(2024).optional(),
  slug: z.string().min(2).max(64),
  expiration: z.date().min(new Date()).optional(),
});

export type CreateLinkPayload = z.infer<typeof createLinkPayloadSchema>;
