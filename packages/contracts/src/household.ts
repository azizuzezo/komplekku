import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";
import { householdSummarySchema } from "./me";
import { householdRelationshipSchema } from "./onboarding";

export const occupancyStatusSchema = z.enum(["OWNER_OCCUPIED", "RENTED", "VACANT"]);
export type OccupancyStatus = z.infer<typeof occupancyStatusSchema>;

export const currentHouseholdMemberSchema = z.object({
  residentId: z.string().uuid(),
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
