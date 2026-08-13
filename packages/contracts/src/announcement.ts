import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const announcementPrioritySchema = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);

export const announcementSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string().min(1),
  priority: announcementPrioritySchema,
  publishedAt: z.string().datetime({ offset: true }),
  isRead: z.boolean(),
});

export const announcementDetailSchema = announcementSummarySchema.extend({
  body: z.string().min(1),
});

export const announcementListResponseSchema = dataEnvelopeSchema(
  z.object({
    items: z.array(announcementSummarySchema),
  }),
);

export type AnnouncementListResponse = z.infer<typeof announcementListResponseSchema>;

export const announcementDetailResponseSchema = dataEnvelopeSchema(
  z.object({
    announcement: announcementDetailSchema,
  }),
);

export type AnnouncementDetailResponse = z.infer<typeof announcementDetailResponseSchema>;

export const markAnnouncementReadResponseSchema = dataEnvelopeSchema(
  z.object({
    announcementId: z.string().uuid(),
    readAt: z.string().datetime({ offset: true }),
  }),
);

export type MarkAnnouncementReadResponse = z.infer<typeof markAnnouncementReadResponseSchema>;

export type AnnouncementSummary = z.infer<typeof announcementSummarySchema>;
export type AnnouncementDetail = z.infer<typeof announcementDetailSchema>;
export type AnnouncementPriority = z.infer<typeof announcementPrioritySchema>;

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(240),
  summary: z.string().min(5, "Ringkasan minimal 5 karakter").max(500),
  body: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  priority: announcementPrioritySchema.default("NORMAL"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
