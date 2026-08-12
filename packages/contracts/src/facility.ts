import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const facilityBookingStatusSchema = z.enum(["CONFIRMED", "CANCELLED"]);

export type FacilityBookingStatus = z.infer<typeof facilityBookingStatusSchema>;

export const facilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  openTime: z.string().min(1),
  closeTime: z.string().min(1),
  capacity: z.number().int().nonnegative().nullable(),
  rules: z.string().nullable(),
});

export type Facility = z.infer<typeof facilitySchema>;

export const facilityListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(facilitySchema) }),
);

export type FacilityListResponse = z.infer<typeof facilityListResponseSchema>;

const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Waktu harus menggunakan format HH:mm.");

export const createFacilityBookingInputSchema = z
  .object({
    facilityId: z.string().uuid(),
    bookingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD."),
    startTime: timeSchema,
    endTime: timeSchema,
    purpose: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((input) => input.startTime < input.endTime, {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["endTime"],
  });

export type CreateFacilityBookingInput = z.infer<typeof createFacilityBookingInputSchema>;

export const facilityBookingListQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const facilityBookingSchema = z.object({
  id: z.string().uuid(),
  facilityId: z.string().uuid(),
  facilityName: z.string().min(1),
  bookingDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().nullable(),
  status: facilityBookingStatusSchema,
  bookedByName: z.string().min(1),
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export type FacilityBooking = z.infer<typeof facilityBookingSchema>;

export const facilityBookingListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(facilityBookingSchema) }),
);

export const facilityBookingMutationResponseSchema = dataEnvelopeSchema(
  z.object({ booking: facilityBookingSchema }),
);

export type FacilityBookingListResponse = z.infer<typeof facilityBookingListResponseSchema>;
export type FacilityBookingMutationResponse = z.infer<typeof facilityBookingMutationResponseSchema>;
