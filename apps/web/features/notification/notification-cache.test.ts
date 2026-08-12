import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@komplekku/contracts";
import { describe, expect, it } from "vitest";

import {
  clearUnreadCount,
  decrementUnreadCount,
  setAllNotificationsRead,
  setNotificationRead,
  type NotificationPages,
} from "./notification-cache";
import { notificationListPath } from "./notification-api";
import { notificationEntityHref } from "./notification-presenter";

const listResponse: NotificationListResponse = {
  data: {
    items: [
      {
        id: "00000000-0000-4000-8000-000000000701",
        title: "Agenda lingkungan",
        message: "Jadwal baru tersedia.",
        readAt: null,
        createdAt: "2026-08-11T05:00:00.000Z",
        entityType: "EVENT",
        entityId: "00000000-0000-4000-8000-000000000601",
        priority: "NORMAL",
      },
    ],
  },
  meta: {},
};

const pages: NotificationPages = { pages: [listResponse], pageParams: [undefined] };
const unread: NotificationUnreadCountResponse = { data: { unreadCount: 1 }, meta: {} };

describe("notification client state", () => {
  it("updates read state and unread counters without losing paginated data", () => {
    const readAt = "2026-08-11T06:00:00.000Z";
    expect(
      setNotificationRead(pages, "00000000-0000-4000-8000-000000000701", readAt)?.pages[0]?.data
        .items[0]?.readAt,
    ).toBe(readAt);
    expect(decrementUnreadCount(unread)?.data.unreadCount).toBe(0);
    expect(setAllNotificationsRead(pages, readAt)?.pages[0]?.data.items[0]?.readAt).toBe(readAt);
    expect(clearUnreadCount(unread)?.data.unreadCount).toBe(0);
  });

  it("links only implemented entity types and preserves real cursor pagination", () => {
    expect(
      notificationEntityHref({
        entityType: "EVENT",
        entityId: "00000000-0000-4000-8000-000000000601",
      }),
    ).toBe("/agenda/00000000-0000-4000-8000-000000000601");
    expect(notificationEntityHref({ entityType: "UNKNOWN", entityId: null })).toBeUndefined();
    expect(
      notificationListPath({
        cursor: "00000000-0000-4000-8000-000000000701",
        limit: 10,
      }),
    ).toBe("/notifications?limit=10&cursor=00000000-0000-4000-8000-000000000701");
  });
});
