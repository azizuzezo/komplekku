import { z } from "zod";

import { authStateSchema } from "./auth";
import { communitySummarySchema } from "./community";
import { dataEnvelopeSchema } from "./envelope";

export const residentStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "MOVED_OUT",
]);

export const houseSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  block: z.string().min(1),
  number: z.string().min(1),
  addressLabel: z.string().min(1),
});

export const householdSummarySchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  house: houseSummarySchema,
});

export const currentContextSchema = z.object({
  community: communitySummarySchema,
  household: householdSummarySchema,
});

export const meResponseSchema = dataEnvelopeSchema(
  z.object({
    id: z.string().uuid(),
    displayName: z.string().nullable(),
    phoneMasked: z.string(),
    allowResidentContact: z.boolean(),
    authState: authStateSchema,
    residentStatus: residentStatusSchema.nullable(),
    currentContext: currentContextSchema.nullable(),
    permissions: z.array(z.string().min(1)),
  }),
);

export const updateProfileInputSchema = z
  .object({
    displayName: z.string().trim().min(2).max(160).optional(),
    allowResidentContact: z.boolean().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan profil.",
  });

export const updateProfileResponseSchema = dataEnvelopeSchema(
  z.object({
    displayName: z.string().min(1).nullable(),
    allowResidentContact: z.boolean(),
  }),
);

export type MeResponse = z.infer<typeof meResponseSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type ResidentStatus = z.infer<typeof residentStatusSchema>;
export type HouseholdSummary = z.infer<typeof householdSummarySchema>;
export type CurrentContext = z.infer<typeof currentContextSchema>;
