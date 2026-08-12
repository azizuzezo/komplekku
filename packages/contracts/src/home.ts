import { z } from "zod";

import { announcementSummarySchema } from "./announcement";
import { communitySummarySchema } from "./community";
import { dataEnvelopeSchema } from "./envelope";
import { householdSummarySchema } from "./me";

export const homeResponseSchema = dataEnvelopeSchema(
  z.object({
    viewer: z.object({
      displayName: z.string().min(1),
      firstName: z.string().min(1),
    }),
    community: communitySummarySchema,
    household: householdSummarySchema,
    latestAnnouncements: z.array(announcementSummarySchema),
    unreadAnnouncementCount: z.number().int().nonnegative(),
  }),
);

export type HomeResponse = z.infer<typeof homeResponseSchema>;
