import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@komplekku/contracts";
import type { InfiniteData } from "@tanstack/react-query";

export type NotificationPages = InfiniteData<NotificationListResponse, string | undefined>;

export function setNotificationRead(
  current: NotificationPages | undefined,
  notificationId: string,
  readAt: string,
) {
  if (!current) return current;
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        items: page.data.items.map((notification) =>
          notification.id === notificationId ? { ...notification, readAt } : notification,
        ),
      },
    })),
  };
}

export function setAllNotificationsRead(current: NotificationPages | undefined, readAt: string) {
  if (!current) return current;
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        items: page.data.items.map((notification) => ({ ...notification, readAt })),
      },
    })),
  };
}

export function decrementUnreadCount(current: NotificationUnreadCountResponse | undefined) {
  if (!current) return current;
  return {
    ...current,
    data: { unreadCount: Math.max(0, current.data.unreadCount - 1) },
  };
}

export function clearUnreadCount(current: NotificationUnreadCountResponse | undefined) {
  if (!current) return current;
  return { ...current, data: { unreadCount: 0 } };
}
