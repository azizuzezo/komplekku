import {
  announcementDetailResponseSchema,
  announcementListResponseSchema,
  markAnnouncementReadResponseSchema,
  type AnnouncementDetailResponse,
  type AnnouncementListResponse,
  type MarkAnnouncementReadResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export function getAnnouncements(): Promise<AnnouncementListResponse> {
  return apiRequest("/announcements", announcementListResponseSchema);
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
