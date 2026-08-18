import type { AnnouncementRecord } from "../domain/repository";

/**
 * Wire shape for one announcement, shared by the noticeboard routes and the
 * home snapshot.
 *
 * This lives in one place on purpose: the two routes used to carry identical
 * copies of it, so adding a field to `announcementSummarySchema` silently left
 * the home response failing contract validation.
 */
export function announcementSummary(announcement: AnnouncementRecord) {
  return {
    id: announcement.id,
    title: announcement.title,
    summary: announcement.summary,
    priority: announcement.priority,
    category: announcement.category,
    coverImageUrl: announcement.coverImageUrl,
    publishedAt: announcement.publishedAt.toISOString(),
    isRead: announcement.isRead,
  };
}
