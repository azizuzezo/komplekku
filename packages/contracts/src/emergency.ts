import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const emergencyKindSchema = z.enum([
  "SECURITY",
  "MEDICAL",
  "FIRE",
  "ENVIRONMENTAL",
  "OTHER",
]);
export const emergencyStatusSchema = z.enum(["SENT", "ACKNOWLEDGED", "RESPONDING", "RESOLVED"]);

export type EmergencyKind = z.infer<typeof emergencyKindSchema>;
export type EmergencyStatus = z.infer<typeof emergencyStatusSchema>;

export const createEmergencyInputSchema = z
  .object({
    kind: emergencyKindSchema,
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateEmergencyInput = z.infer<typeof createEmergencyInputSchema>;

export const emergencySchema = z.object({
  id: z.string().uuid(),
  kind: emergencyKindSchema,
  status: emergencyStatusSchema,
  houseLabel: z.string().min(1),
  senderName: z.string().min(1),
  note: z.string().nullable(),
  sentAt: z.string().datetime({ offset: true }),
  acknowledgedAt: z.string().datetime({ offset: true }).nullable(),
  respondingAt: z.string().datetime({ offset: true }).nullable(),
  resolvedAt: z.string().datetime({ offset: true }).nullable(),
});

export type Emergency = z.infer<typeof emergencySchema>;

export const emergencyListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(emergencySchema) }),
);

export const emergencyMutationResponseSchema = dataEnvelopeSchema(
  z.object({ emergency: emergencySchema }),
);

export type EmergencyListResponse = z.infer<typeof emergencyListResponseSchema>;
export type EmergencyMutationResponse = z.infer<typeof emergencyMutationResponseSchema>;
