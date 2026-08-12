import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";
import { householdSummarySchema } from "./me";
import { householdRelationshipSchema } from "./onboarding";

export const occupancyStatusSchema = z.enum(["OWNER_OCCUPIED", "RENTED", "VACANT"]);
export type OccupancyStatus = z.infer<typeof occupancyStatusSchema>;

export const currentHouseholdMemberSchema = z.object({
  residentId: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  relationship: householdRelationshipSchema,
  linkedAccount: z.boolean(),
  phoneMasked: z.string().min(1).nullable(),
});

export const currentHouseholdResponseSchema = dataEnvelopeSchema(
  z.object({
    household: householdSummarySchema.extend({
      occupancyStatus: occupancyStatusSchema,
      members: z.array(currentHouseholdMemberSchema),
    }),
  }),
);

export type CurrentHouseholdMember = z.infer<typeof currentHouseholdMemberSchema>;
export type CurrentHouseholdResponse = z.infer<typeof currentHouseholdResponseSchema>;

export const addHouseholdMemberInputSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  phone: z.string().trim().min(8).max(20),
  relationship: householdRelationshipSchema,
});

export type AddHouseholdMemberInput = z.infer<typeof addHouseholdMemberInputSchema>;

export const addHouseholdMemberResponseSchema = dataEnvelopeSchema(
  z.object({
    member: currentHouseholdMemberSchema,
  }),
);

export type AddHouseholdMemberResponse = z.infer<typeof addHouseholdMemberResponseSchema>;

export const removeHouseholdMemberResponseSchema = dataEnvelopeSchema(
  z.object({
    residentId: z.string().uuid(),
    removed: z.literal(true),
  }),
);

export type RemoveHouseholdMemberResponse = z.infer<typeof removeHouseholdMemberResponseSchema>;
