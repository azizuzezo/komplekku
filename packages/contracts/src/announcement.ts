import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const announcementPrioritySchema = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);

/** How an announcement is filed on the noticeboard — a separate question from
 * how urgent it is (`priority`). */
export const announcementCategorySchema = z.enum(["INFO", "EVENT"]);

export type AnnouncementCategory = z.infer<typeof announcementCategorySchema>;

export const announcementSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string().min(1),
  priority: announcementPrioritySchema,
  category: announcementCategorySchema,
  coverImageUrl: z.string().url().nullable(),
  publishedAt: z.string().datetime({ offset: true }),
  isRead: z.boolean(),
});

export const announcementDetailSchema = announcementSummarySchema.extend({
  body: z.string().min(1),
});

/** The chips on the noticeboard: everything, the urgent ones, kegiatan, and
 * plain information. */
export const announcementFilterSchema = z.enum(["all", "important", "event", "info"]);

export type AnnouncementFilter = z.infer<typeof announcementFilterSchema>;

export const announcementListQuerySchema = z.object({
  filter: announcementFilterSchema.default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AnnouncementListQuery = z.infer<typeof announcementListQuerySchema>;

export type AnnouncementBadge = "important" | "event" | "info";

/**
 * The single badge an announcement carries. Urgency wins over filing: an
 * urgent kegiatan reads as "Penting" first, because that is what a warga
 * scanning the board needs to notice.
 *
 * Deriving it here — rather than storing a third "IMPORTANT" category — is
 * what keeps `priority` and `category` from ever disagreeing about whether
 * something is penting.
 */
export function announcementBadge(announcement: {
  priority: z.infer<typeof announcementPrioritySchema>;
  category: AnnouncementCategory;
}): AnnouncementBadge {
  if (announcement.priority !== "NORMAL") return "important";
  return announcement.category === "EVENT" ? "event" : "info";
}

export const ANNOUNCEMENT_BADGE_LABELS: Record<AnnouncementBadge, string> = {
  important: "Penting",
  event: "Acara",
  info: "Info",
};

export const ANNOUNCEMENT_FILTER_LABELS: Record<AnnouncementFilter, string> = {
  all: "Semua",
  important: "Penting",
  event: "Acara",
  info: "Info",
};

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
  category: announcementCategorySchema.default("INFO"),
  coverImageUrl: z.string().url().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(240),
    summary: z.string().trim().min(5, "Ringkasan minimal 5 karakter").max(500),
    body: z.string().trim().min(10, "Isi pengumuman minimal 10 karakter"),
    priority: announcementPrioritySchema,
    category: announcementCategorySchema,
    coverImageUrl: z.string().url().nullable(),
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan pengumuman.",
  });

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

/** Taking a notice off the board archives it rather than erasing the row, so
 * the audit trail and any notification that referenced it stay intact. */
export const archiveAnnouncementResponseSchema = dataEnvelopeSchema(
  z.object({
    announcementId: z.string().uuid(),
    archivedAt: z.string().datetime({ offset: true }),
  }),
);

export type ArchiveAnnouncementResponse = z.infer<typeof archiveAnnouncementResponseSchema>;
