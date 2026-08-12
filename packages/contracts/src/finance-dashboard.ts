import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const financeDashboardResponseSchema = dataEnvelopeSchema(
  z.object({
    outstandingInvoiceCount: z.number().int().nonnegative(),
    outstandingInvoiceAmount: z.number().int().nonnegative(),
    pendingVerificationCount: z.number().int().nonnegative(),
    collectedThisMonth: z.number().int().nonnegative(),
    cashBalance: z.number().int(),
  }),
);

export type FinanceDashboardResponse = z.infer<typeof financeDashboardResponseSchema>;
