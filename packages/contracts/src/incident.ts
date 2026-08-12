import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const incidentCategorySchema = z.enum([
  "SECURITY",
  "SUSPICIOUS_ACTIVITY",
  "DAMAGE",
  "NOISE",
  "TRAFFIC",
  "LOST_ITEM",
  "EMERGENCY",
  "OTHER",
]);
export const incidentStatusSchema = z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]);

export type IncidentCategory = z.infer<typeof incidentCategorySchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;

export const createIncidentInputSchema = z
  .object({
    category: incidentCategorySchema,
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(3).max(4000),
    location: z.string().trim().min(1).max(200).optional(),
    occurredAt: z.string().datetime({ offset: true }),
    peopleInvolved: z.string().trim().max(1000).optional(),
  })
  .strict();

export type CreateIncidentInput = z.infer<typeof createIncidentInputSchema>;

export const updateIncidentInputSchema = z
  .object({
    status: incidentStatusSchema.optional(),
    actionTaken: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan laporan.",
  });

export type UpdateIncidentInput = z.infer<typeof updateIncidentInputSchema>;

export const incidentListQuerySchema = z.object({
  status: incidentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const incidentSummarySchema = z.object({
  id: z.string().uuid(),
  category: incidentCategorySchema,
  title: z.string().min(1),
  location: z.string().nullable(),
  occurredAt: z.string().datetime({ offset: true }),
  status: incidentStatusSchema,
  reporterName: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export const incidentDetailSchema = incidentSummarySchema.extend({
  description: z.string().min(1),
  peopleInvolved: z.string().nullable(),
  actionTaken: z.string().nullable(),
});

export type IncidentSummary = z.infer<typeof incidentSummarySchema>;
export type IncidentDetail = z.infer<typeof incidentDetailSchema>;

export const incidentListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(incidentSummarySchema) }),
);

export const incidentDetailResponseSchema = dataEnvelopeSchema(
  z.object({ incident: incidentDetailSchema }),
);

export const incidentMutationResponseSchema = dataEnvelopeSchema(
  z.object({ incident: incidentDetailSchema }),
);

export type IncidentListResponse = z.infer<typeof incidentListResponseSchema>;
export type IncidentDetailResponse = z.infer<typeof incidentDetailResponseSchema>;
export type IncidentMutationResponse = z.infer<typeof incidentMutationResponseSchema>;
