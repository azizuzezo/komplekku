import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const duesTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  defaultAmount: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export type DuesType = z.infer<typeof duesTypeSchema>;

export const createDuesTypeInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(500).optional(),
    defaultAmount: z.number().int().positive(),
  })
  .strict();

export type CreateDuesTypeInput = z.infer<typeof createDuesTypeInputSchema>;

export const duesTypeListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(duesTypeSchema) }),
);

export const duesTypeMutationResponseSchema = dataEnvelopeSchema(
  z.object({ duesType: duesTypeSchema }),
);

export type DuesTypeListResponse = z.infer<typeof duesTypeListResponseSchema>;
export type DuesTypeMutationResponse = z.infer<typeof duesTypeMutationResponseSchema>;
