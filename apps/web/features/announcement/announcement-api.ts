import {
  announcementDetailResponseSchema,
  announcementListResponseSchema,
  markAnnouncementReadResponseSchema,
  type AnnouncementDetailResponse,
  type AnnouncementListResponse,
  type CreateAnnouncementInput,
  archiveAnnouncementResponseSchema,
  type AnnouncementFilter,
  type ArchiveAnnouncementResponse,
  type MarkAnnouncementReadResponse,
  type UpdateAnnouncementInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const announcementKeys = {
  all: ["announcements"] as const,
  list: (filter: AnnouncementFilter) => ["announcements", filter] as const,
};

export function getAnnouncements(
  filter: AnnouncementFilter = "all",
): Promise<AnnouncementListResponse> {
  const query = filter === "all" ? "" : `?filter=${filter}`;
  return apiRequest(`/announcements${query}`, announcementListResponseSchema);
}

export function getAnnouncement(id: string): Promise<AnnouncementDetailResponse> {
  return apiRequest(`/announcements/${encodeURIComponent(id)}`, announcementDetailResponseSchema);
}

export function markAnnouncementRead(id: string): Promise<MarkAnnouncementReadResponse> {
  return apiRequest(
    `/announcements/${encodeURIComponent(id)}/read`,
    markAnnouncementReadResponseSchema,
    {
      method: "POST",
    },
  );
}

export function createAnnouncement(
  data: CreateAnnouncementInput,
): Promise<AnnouncementDetailResponse> {
  return apiRequest("/announcements", announcementDetailResponseSchema, {
    method: "POST",
    body: data,
  });
}

export function updateAnnouncement(input: {
  id: string;
  changes: UpdateAnnouncementInput;
}): Promise<AnnouncementDetailResponse> {
  return apiRequest(
    `/announcements/${encodeURIComponent(input.id)}`,
    announcementDetailResponseSchema,
    { method: "PATCH", body: input.changes },
  );
}

/** Archives rather than erases — the notice leaves the board but its row and
 * audit trail survive. */
export function archiveAnnouncement(id: string): Promise<ArchiveAnnouncementResponse> {
  return apiRequest(`/announcements/${encodeURIComponent(id)}`, archiveAnnouncementResponseSchema, {
    method: "DELETE",
  });
}
