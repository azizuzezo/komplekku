import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const securityDashboardResponseSchema = dataEnvelopeSchema(
  z.object({
    activeShift: z
      .object({
        id: z.string().uuid(),
        startedAt: z.string().datetime({ offset: true }),
      })
      .nullable(),
    activeVisitorCount: z.number().int().nonnegative(),
    pendingPackageCount: z.number().int().nonnegative(),
    camerasOnline: z.number().int().nonnegative(),
    camerasTotal: z.number().int().nonnegative(),
    openEmergencyCount: z.number().int().nonnegative(),
    activePatrolSession: z
      .object({
        id: z.string().uuid(),
        startedAt: z.string().datetime({ offset: true }),
        completedCheckpoints: z.number().int().nonnegative(),
        totalCheckpoints: z.number().int().nonnegative(),
      })
      .nullable(),
  }),
);

export type SecurityDashboardResponse = z.infer<typeof securityDashboardResponseSchema>;
