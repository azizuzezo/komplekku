import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const paymentStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED"]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const createPaymentInputSchema = z
  .object({
    invoiceId: z.string().uuid(),
    amount: z.number().int().positive(),
    paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD."),
    note: z.string().trim().min(3).max(300),
  })
  .strict();

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

export const rejectPaymentInputSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type RejectPaymentInput = z.infer<typeof rejectPaymentInputSchema>;

export const paymentListQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  duesTypeName: z.string().min(1),
  period: z.string().min(1),
  amount: z.number().int().nonnegative(),
  paidAt: z.string(),
  note: z.string().min(1),
  status: paymentStatusSchema,
  submittedByName: z.string().min(1),
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  verifiedByName: z.string().nullable(),
  verifiedAt: z.string().datetime({ offset: true }).nullable(),
  rejectionReason: z.string().nullable(),
  receiptNumber: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type Payment = z.infer<typeof paymentSchema>;

export const paymentListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(paymentSchema) }),
);

export const paymentMutationResponseSchema = dataEnvelopeSchema(
  z.object({ payment: paymentSchema }),
);

export type PaymentListResponse = z.infer<typeof paymentListResponseSchema>;
export type PaymentMutationResponse = z.infer<typeof paymentMutationResponseSchema>;
