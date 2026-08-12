import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const securityShiftStatusSchema = z.enum(["ACTIVE", "COMPLETED"]);

export type SecurityShiftStatus = z.infer<typeof securityShiftStatusSchema>;

export const endSecurityShiftInputSchema = z
  .object({
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type EndSecurityShiftInput = z.infer<typeof endSecurityShiftInputSchema>;

export const securityShiftSchema = z.object({
  id: z.string().uuid(),
  officerName: z.string().min(1),
  status: securityShiftStatusSchema,
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).nullable(),
  notes: z.string().nullable(),
});

export type SecurityShift = z.infer<typeof securityShiftSchema>;

export const securityShiftResponseSchema = dataEnvelopeSchema(
  z.object({ shift: securityShiftSchema.nullable() }),
);

export const securityShiftMutationResponseSchema = dataEnvelopeSchema(
  z.object({ shift: securityShiftSchema }),
);

export type SecurityShiftResponse = z.infer<typeof securityShiftResponseSchema>;
export type SecurityShiftMutationResponse = z.infer<typeof securityShiftMutationResponseSchema>;
