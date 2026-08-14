import {
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  notificationListResponseSchema,
  notificationUnreadCountResponseSchema,
  testPushNotificationResponseSchema,
  type MarkAllNotificationsReadResponse,
  type MarkNotificationReadResponse,
  type NotificationListResponse,
  type NotificationUnreadCountResponse,
  type TestPushNotificationResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: ["notifications", "list"] as const,
  list: () => ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export type NotificationPageParams = {
  cursor?: string;
  limit?: number;
};

export function notificationListPath({ cursor, limit = 20 }: NotificationPageParams = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  return `/notifications?${query.toString()}`;
}

export function getNotificationPage(
  params: NotificationPageParams = {},
): Promise<NotificationListResponse> {
  return apiRequest(notificationListPath(params), notificationListResponseSchema);
}

export function getNotificationUnreadCount(): Promise<NotificationUnreadCountResponse> {
  return apiRequest("/notifications/unread-count", notificationUnreadCountResponseSchema);
}

export function markNotificationRead(id: string): Promise<MarkNotificationReadResponse> {
  return apiRequest(
    `/notifications/${encodeURIComponent(id)}/read`,
    markNotificationReadResponseSchema,
    { method: "POST" },
  );
}

export function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  return apiRequest("/notifications/read-all", markAllNotificationsReadResponseSchema, {
    method: "POST",
  });
}

export function sendTestPushNotification(): Promise<TestPushNotificationResponse> {
  return apiRequest("/notifications/test", testPushNotificationResponseSchema, {
    method: "POST",
  });
}
