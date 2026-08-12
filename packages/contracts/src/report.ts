import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const reportCategorySchema = z.enum([
  "STREET_LIGHT",
  "TRASH",
  "DRAINAGE",
  "SECURITY",
  "FACILITY",
  "CLEANLINESS",
  "NOISE",
  "OTHER",
]);
export const reportStatusSchema = z.enum(["SUBMITTED", "RECEIVED", "IN_PROGRESS", "COMPLETED"]);

export type ReportCategory = z.infer<typeof reportCategorySchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const createReportInputSchema = z
  .object({
    category: reportCategorySchema,
    description: z.string().trim().min(3).max(2000),
    location: z.string().trim().min(1).max(200).optional(),
    photoUrls: z.array(z.string().url()).max(5).optional(),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export const addReportUpdateInputSchema = z
  .object({
    status: reportStatusSchema,
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export type AddReportUpdateInput = z.infer<typeof addReportUpdateInputSchema>;

export const reportListQuerySchema = z.object({
  status: reportStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const reportUpdateEntrySchema = z.object({
  id: z.string().uuid(),
  status: reportStatusSchema,
  note: z.string().nullable(),
  actorName: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type ReportUpdateEntry = z.infer<typeof reportUpdateEntrySchema>;

export const reportSummarySchema = z.object({
  id: z.string().uuid(),
  category: reportCategorySchema,
  description: z.string().min(1),
  location: z.string().nullable(),
  status: reportStatusSchema,
  photos: z.array(z.string()),
  reporterName: z.string().min(1),
  houseCode: z.string().min(1),
  householdDisplayName: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

export const reportDetailSchema = reportSummarySchema.extend({
  updates: z.array(reportUpdateEntrySchema),
});

export type ReportDetail = z.infer<typeof reportDetailSchema>;

export const reportListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(reportSummarySchema) }),
);

export const reportDetailResponseSchema = dataEnvelopeSchema(
  z.object({ report: reportDetailSchema }),
);

export const reportMutationResponseSchema = dataEnvelopeSchema(
  z.object({ report: reportDetailSchema }),
);

export type ReportListResponse = z.infer<typeof reportListResponseSchema>;
export type ReportDetailResponse = z.infer<typeof reportDetailResponseSchema>;
export type ReportMutationResponse = z.infer<typeof reportMutationResponseSchema>;
