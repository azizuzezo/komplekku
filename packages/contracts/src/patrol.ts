import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const patrolSessionStatusSchema = z.enum(["IN_PROGRESS", "COMPLETED"]);

export type PatrolSessionStatus = z.infer<typeof patrolSessionStatusSchema>;

export const scanCheckpointInputSchema = z
  .object({
    qrToken: z.string().trim().min(1).max(64),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type ScanCheckpointInput = z.infer<typeof scanCheckpointInputSchema>;

export const patrolCheckpointSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  displayOrder: z.number().int(),
});

export type PatrolCheckpoint = z.infer<typeof patrolCheckpointSchema>;

export const patrolScanSchema = z.object({
  checkpointId: z.string().uuid(),
  checkpointName: z.string().min(1),
  scannedAt: z.string().datetime({ offset: true }),
  note: z.string().nullable(),
});

export type PatrolScan = z.infer<typeof patrolScanSchema>;

export const patrolSessionSchema = z.object({
  id: z.string().uuid(),
  officerName: z.string().min(1),
  status: patrolSessionStatusSchema,
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).nullable(),
  totalCheckpoints: z.number().int().nonnegative(),
  scans: z.array(patrolScanSchema),
});

export type PatrolSession = z.infer<typeof patrolSessionSchema>;

export const patrolCheckpointListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(patrolCheckpointSchema) }),
);

export const patrolSessionResponseSchema = dataEnvelopeSchema(
  z.object({ session: patrolSessionSchema.nullable() }),
);

export const patrolSessionMutationResponseSchema = dataEnvelopeSchema(
  z.object({ session: patrolSessionSchema }),
);

export const patrolHistoryResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(patrolSessionSchema) }),
);

export type PatrolCheckpointListResponse = z.infer<typeof patrolCheckpointListResponseSchema>;
export type PatrolSessionResponse = z.infer<typeof patrolSessionResponseSchema>;
export type PatrolSessionMutationResponse = z.infer<typeof patrolSessionMutationResponseSchema>;
export type PatrolHistoryResponse = z.infer<typeof patrolHistoryResponseSchema>;
