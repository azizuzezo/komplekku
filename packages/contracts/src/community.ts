import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const communitySummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1),
});

export type CommunitySummary = z.infer<typeof communitySummarySchema>;

export const currentCommunityResponseSchema = dataEnvelopeSchema(
  z.object({
    community: communitySummarySchema.extend({
      address: z.string().nullable(),
      contactPhone: z.string().nullable(),
      emergencyContactPhone: z.string().nullable(),
    }),
  }),
);

export type CurrentCommunityResponse = z.infer<typeof currentCommunityResponseSchema>;
