import {
  announcementDetailResponseSchema,
  announcementListResponseSchema,
  markAnnouncementReadResponseSchema,
  type AnnouncementDetailResponse,
  type AnnouncementListResponse,
  type CreateAnnouncementInput,
  type AnnouncementFilter,
  type MarkAnnouncementReadResponse,
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
