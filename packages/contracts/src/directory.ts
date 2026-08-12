import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";
import { occupancyStatusSchema } from "./household";
import { householdRelationshipSchema } from "./onboarding";

export const directoryQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type DirectoryQuery = z.infer<typeof directoryQuerySchema>;

export const directoryContactSchema = z.object({
  displayName: z.string().min(1),
  phoneMasked: z.string().min(1),
});

export const directoryAdminMemberSchema = z.object({
  residentId: z.string().uuid(),
  displayName: z.string().min(1),
  relationship: householdRelationshipSchema,
  status: z.literal("ACTIVE"),
  linkedAccount: z.boolean(),
  contactMasked: z.string().min(1).nullable(),
});

export const directoryItemSchema = z.object({
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  contacts: z.array(directoryContactSchema),
  adminDetails: z
    .object({
      householdId: z.string().uuid(),
      occupancyStatus: occupancyStatusSchema,
      members: z.array(directoryAdminMemberSchema),
    })
    .optional(),
});

export const directoryResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(directoryItemSchema) }),
);

export type DirectoryItem = z.infer<typeof directoryItemSchema>;
export type DirectoryResponse = z.infer<typeof directoryResponseSchema>;
