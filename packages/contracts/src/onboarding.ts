import { z } from "zod";

import { communitySummarySchema, rtSummarySchema } from "./community";
import { dataEnvelopeSchema } from "./envelope";
import { houseSummarySchema } from "./me";

export const householdRelationshipSchema = z.enum([
  "HEAD",
  "SPOUSE",
  "CHILD",
  "PARENT",
  "RELATIVE",
  "TENANT",
  "OTHER",
]);

export type HouseholdRelationship = z.infer<typeof householdRelationshipSchema>;

export const onboardingCommunityOptionSchema = communitySummarySchema.extend({
  rts: z.array(rtSummarySchema),
});

export type OnboardingCommunityOption = z.infer<typeof onboardingCommunityOptionSchema>;

export const onboardingOptionsResponseSchema = dataEnvelopeSchema(
  z.object({
    communities: z.array(onboardingCommunityOptionSchema),
  }),
);

export type OnboardingOptionsResponse = z.infer<typeof onboardingOptionsResponseSchema>;

export const residencyRequestInputSchema = z.object({
  communityId: z.string().uuid(),
  rtId: z.string().uuid(),
  houseCode: z.string().trim().min(1).max(24),
  fullName: z.string().trim().min(3).max(160),
  relationship: householdRelationshipSchema,
});

export type ResidencyRequestInput = z.infer<typeof residencyRequestInputSchema>;

export const residencyRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["PENDING", "ACTIVE", "REJECTED"]),
  fullName: z.string().min(1),
  relationship: householdRelationshipSchema,
  submittedAt: z.string().datetime({ offset: true }),
  community: communitySummarySchema,
  house: houseSummarySchema,
});

export const residencyRequestResponseSchema = dataEnvelopeSchema(
  z.object({
    request: residencyRequestSchema,
  }),
);

export type ResidencyRequestResponse = z.infer<typeof residencyRequestResponseSchema>;

export const adminResidencyRequestSchema = residencyRequestSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    phoneMasked: z.string().min(1),
  }),
});

export const adminResidencyRequestListResponseSchema = dataEnvelopeSchema(
  z.object({
    items: z.array(adminResidencyRequestSchema),
  }),
);

export type AdminResidencyRequestListResponse = z.infer<
  typeof adminResidencyRequestListResponseSchema
>;

export const approveResidencyRequestResponseSchema = dataEnvelopeSchema(
  z.object({
    requestId: z.string().uuid(),
    status: z.literal("ACTIVE"),
    reviewedAt: z.string().datetime({ offset: true }),
    householdId: z.string().uuid(),
  }),
);

export type ApproveResidencyRequestResponse = z.infer<typeof approveResidencyRequestResponseSchema>;

export const rejectResidencyRequestInputSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type RejectResidencyRequestInput = z.infer<typeof rejectResidencyRequestInputSchema>;

export const rejectResidencyRequestResponseSchema = dataEnvelopeSchema(
  z.object({
    requestId: z.string().uuid(),
    status: z.literal("REJECTED"),
    reviewedAt: z.string().datetime({ offset: true }),
  }),
);

export type RejectResidencyRequestResponse = z.infer<typeof rejectResidencyRequestResponseSchema>;
