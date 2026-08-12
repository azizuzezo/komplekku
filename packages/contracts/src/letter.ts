import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const letterRequestStatusSchema = z.enum(["SUBMITTED", "APPROVED", "REJECTED", "READY"]);

export type LetterRequestStatus = z.infer<typeof letterRequestStatusSchema>;

export const letterTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
});

export type LetterType = z.infer<typeof letterTypeSchema>;

export const letterTypeListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(letterTypeSchema) }),
);

export type LetterTypeListResponse = z.infer<typeof letterTypeListResponseSchema>;

export const createLetterRequestInputSchema = z
  .object({
    letterTypeId: z.string().uuid(),
    purpose: z.string().trim().min(3).max(1000),
  })
  .strict();

export type CreateLetterRequestInput = z.infer<typeof createLetterRequestInputSchema>;

export const rejectLetterRequestInputSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type RejectLetterRequestInput = z.infer<typeof rejectLetterRequestInputSchema>;

export const letterRequestListQuerySchema = z.object({
  status: letterRequestStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const letterRequestSchema = z.object({
  id: z.string().uuid(),
  letterTypeId: z.string().uuid(),
  letterTypeName: z.string().min(1),
  purpose: z.string().min(1),
  status: letterRequestStatusSchema,
  requesterName: z.string().min(1),
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  reviewedByName: z.string().nullable(),
  reviewedAt: z.string().datetime({ offset: true }).nullable(),
  rejectionReason: z.string().nullable(),
  readyAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type LetterRequest = z.infer<typeof letterRequestSchema>;

export const letterRequestListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(letterRequestSchema) }),
);

export const letterRequestMutationResponseSchema = dataEnvelopeSchema(
  z.object({ request: letterRequestSchema }),
);

export type LetterRequestListResponse = z.infer<typeof letterRequestListResponseSchema>;
export type LetterRequestMutationResponse = z.infer<typeof letterRequestMutationResponseSchema>;
