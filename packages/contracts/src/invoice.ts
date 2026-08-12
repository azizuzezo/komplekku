import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const invoiceStatusSchema = z.enum([
  "UNPAID",
  "PENDING_VERIFICATION",
  "PAID",
  "OVERDUE",
  "WAIVED",
]);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const generateInvoicesInputSchema = z
  .object({
    duesTypeId: z.string().uuid(),
    period: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode harus menggunakan format YYYY-MM."),
    amount: z.number().int().positive(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD."),
  })
  .strict();

export type GenerateInvoicesInput = z.infer<typeof generateInvoicesInputSchema>;

export const waiveInvoiceInputSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type WaiveInvoiceInput = z.infer<typeof waiveInvoiceInputSchema>;

export const invoiceListQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  duesTypeId: z.string().uuid(),
  duesTypeName: z.string().min(1),
  period: z.string().min(1),
  amount: z.number().int().nonnegative(),
  dueDate: z.string(),
  status: invoiceStatusSchema,
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  waivedReason: z.string().nullable(),
  paidAt: z.string().datetime({ offset: true }).nullable(),
  receiptNumber: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(invoiceSchema) }),
);

export const invoiceDetailResponseSchema = dataEnvelopeSchema(z.object({ invoice: invoiceSchema }));

export const invoiceMutationResponseSchema = dataEnvelopeSchema(
  z.object({ invoice: invoiceSchema }),
);

export const generateInvoicesResponseSchema = dataEnvelopeSchema(
  z.object({ createdCount: z.number().int().nonnegative() }),
);

export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;
export type InvoiceDetailResponse = z.infer<typeof invoiceDetailResponseSchema>;
export type InvoiceMutationResponse = z.infer<typeof invoiceMutationResponseSchema>;
export type GenerateInvoicesResponse = z.infer<typeof generateInvoicesResponseSchema>;
