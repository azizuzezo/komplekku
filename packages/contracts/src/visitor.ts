import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const visitorStatusSchema = z.enum([
  "PENDING",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
]);

export type VisitorStatus = z.infer<typeof visitorStatusSchema>;

export const createVisitorInputSchema = z
  .object({
    guestName: z.string().trim().min(2).max(160),
    guestPhone: z.string().trim().min(6).max(24).optional(),
    visitDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD."),
    expectedTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Waktu harus menggunakan format HH:mm.")
      .optional(),
    vehicleInfo: z.string().trim().max(160).optional(),
    plate: z.string().trim().max(20).optional(),
    purpose: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type CreateVisitorInput = z.infer<typeof createVisitorInputSchema>;

export const createWalkInVisitorInputSchema = z
  .object({
    houseCode: z.string().trim().min(1).max(24),
    guestName: z.string().trim().min(2).max(160),
    guestPhone: z.string().trim().min(6).max(24).optional(),
    vehicleInfo: z.string().trim().max(160).optional(),
    plate: z.string().trim().max(20).optional(),
    purpose: z.string().trim().max(200).optional(),
  })
  .strict();

export type CreateWalkInVisitorInput = z.infer<typeof createWalkInVisitorInputSchema>;

export const visitorSchema = z.object({
  id: z.string().uuid(),
  guestName: z.string().min(1),
  guestPhone: z.string().nullable(),
  visitDate: z.string(),
  expectedTime: z.string().nullable(),
  vehicleInfo: z.string().nullable(),
  plate: z.string().nullable(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  status: visitorStatusSchema,
  isWalkIn: z.boolean(),
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  checkedInAt: z.string().datetime({ offset: true }).nullable(),
  checkedOutAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type Visitor = z.infer<typeof visitorSchema>;

export const visitorWithQrSchema = visitorSchema.extend({
  qrToken: z.string().min(1),
});

export type VisitorWithQr = z.infer<typeof visitorWithQrSchema>;

export const visitorListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(visitorSchema) }),
);

export const visitorMutationResponseSchema = dataEnvelopeSchema(
  z.object({ visitor: visitorWithQrSchema }),
);

export const visitorLookupResponseSchema = dataEnvelopeSchema(
  z.object({ visitor: visitorSchema.nullable() }),
);

export type VisitorListResponse = z.infer<typeof visitorListResponseSchema>;
export type VisitorMutationResponse = z.infer<typeof visitorMutationResponseSchema>;
export type VisitorLookupResponse = z.infer<typeof visitorLookupResponseSchema>;
