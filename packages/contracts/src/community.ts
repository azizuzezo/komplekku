import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const communitySummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1),
});

export type CommunitySummary = z.infer<typeof communitySummarySchema>;

export const iqomahDelayMinutesSchema = z.number().int().min(1).max(60);

export const currentCommunityResponseSchema = dataEnvelopeSchema(
  z.object({
    community: communitySummarySchema.extend({
      address: z.string().nullable(),
      rwLabel: z.string().nullable(),
      contactPhone: z.string().nullable(),
      emergencyContactPhone: z.string().nullable(),
      iqomahDelayMinutes: iqomahDelayMinutesSchema,
    }),
  }),
);

export type CurrentCommunityResponse = z.infer<typeof currentCommunityResponseSchema>;

export const rtSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
});

export type RtSummary = z.infer<typeof rtSummarySchema>;

export const rtListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(rtSummarySchema) }),
);

export type RtListResponse = z.infer<typeof rtListResponseSchema>;

export const createRtInputSchema = z
  .object({
    code: z.string().trim().min(1).max(16),
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export type CreateRtInput = z.infer<typeof createRtInputSchema>;

export const updateRtInputSchema = z
  .object({
    code: z.string().trim().min(1).max(16).optional(),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export type UpdateRtInput = z.infer<typeof updateRtInputSchema>;

export const rtMutationResponseSchema = dataEnvelopeSchema(z.object({ rt: rtSummarySchema }));

export type RtMutationResponse = z.infer<typeof rtMutationResponseSchema>;

export const updateCommunityInputSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    address: z.string().trim().max(2000).nullable().optional(),
    rwLabel: z.string().trim().max(60).nullable().optional(),
    contactPhone: z.string().trim().max(24).nullable().optional(),
    emergencyContactPhone: z.string().trim().max(24).nullable().optional(),
    registrationOpen: z.boolean().optional(),
    iqomahDelayMinutes: iqomahDelayMinutesSchema.optional(),
  })
  .strict();

export type UpdateCommunityInput = z.infer<typeof updateCommunityInputSchema>;

export const createCommunityInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
    name: z.string().trim().min(1).max(160),
    address: z.string().trim().max(2000).optional(),
    rwLabel: z.string().trim().max(60).optional(),
    timezone: z.string().trim().min(1).max(64).default("Asia/Jakarta"),
  })
  .strict();

export type CreateCommunityInput = z.infer<typeof createCommunityInputSchema>;

export const communityAdminSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable(),
  rwLabel: z.string().nullable(),
  timezone: z.string().min(1),
  registrationOpen: z.boolean(),
  iqomahDelayMinutes: iqomahDelayMinutesSchema,
});

export type CommunityAdminSummary = z.infer<typeof communityAdminSummarySchema>;

export const communityMutationResponseSchema = dataEnvelopeSchema(
  z.object({ community: communityAdminSummarySchema }),
);

export type CommunityMutationResponse = z.infer<typeof communityMutationResponseSchema>;

export const communityListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(communityAdminSummarySchema) }),
);

export type CommunityListResponse = z.infer<typeof communityListResponseSchema>;
