import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const packageStatusSchema = z.enum(["RECEIVED", "NOTIFIED", "COLLECTED"]);

export type PackageStatus = z.infer<typeof packageStatusSchema>;

export const createPackageInputSchema = z
  .object({
    houseCode: z.string().trim().min(1).max(24),
    recipientName: z.string().trim().min(2).max(160),
    courier: z.string().trim().min(1).max(80),
    trackingNumber: z.string().trim().max(120).optional(),
  })
  .strict();

export type CreatePackageInput = z.infer<typeof createPackageInputSchema>;

export const collectPackageInputSchema = z
  .object({
    collectedByName: z.string().trim().min(2).max(160),
  })
  .strict();

export type CollectPackageInput = z.infer<typeof collectPackageInputSchema>;

export const packageSchema = z.object({
  id: z.string().uuid(),
  recipientName: z.string().min(1),
  courier: z.string().min(1),
  trackingNumber: z.string().nullable(),
  status: packageStatusSchema,
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  receivedAt: z.string().datetime({ offset: true }),
  collectedAt: z.string().datetime({ offset: true }).nullable(),
  collectedByName: z.string().nullable(),
});

export type Package = z.infer<typeof packageSchema>;

export const packageListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(packageSchema) }),
);

export const packageMutationResponseSchema = dataEnvelopeSchema(
  z.object({ package: packageSchema }),
);

export type PackageListResponse = z.infer<typeof packageListResponseSchema>;
export type PackageMutationResponse = z.infer<typeof packageMutationResponseSchema>;
