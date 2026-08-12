import {
  agendaDetailResponseSchema,
  agendaListResponseSchema,
  agendaMutationResponseSchema,
  archiveAgendaEventResponseSchema,
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  notificationListResponseSchema,
  notificationUnreadCountResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

const managedPermissions = [
  "agenda.manage",
  "agenda.read",
  "announcement.read",
  "community.read",
  "home.read",
  "household.read",
  "notification.read",
];

describe("agenda dan notifikasi in-app", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("memisahkan agenda mendatang/lampau dan menolak cursor yang tidak terlihat", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);

    const upcoming = await app.inject({
      method: "GET",
      url: "/api/v1/agenda?view=upcoming&limit=1",
      headers: { cookie },
    });
    expect(upcoming.statusCode).toBe(200);
    expect(agendaListResponseSchema.safeParse(upcoming.json()).success).toBe(true);
    expect(upcoming.json().data.items.map((item: { id: string }) => item.id)).toEqual([
      demoIds.agendaUpcoming,
    ]);

    const past = await app.inject({
      method: "GET",
      url: "/api/v1/agenda?view=past",
      headers: { cookie },
    });
    expect(past.statusCode).toBe(200);
    expect(past.json().data.items.map((item: { id: string }) => item.id)).toEqual([
      demoIds.agendaPast,
    ]);

    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/agenda/${demoIds.agendaUpcoming}`,
      headers: { cookie },
    });
    expect(detail.statusCode).toBe(200);
    expect(agendaDetailResponseSchema.safeParse(detail.json()).success).toBe(true);

    const foreignCursor = await app.inject({
      method: "GET",
      url: `/api/v1/agenda?cursor=${demoIds.agendaSecondTenant}`,
      headers: { cookie },
    });
    expect(foreignCursor.statusCode).toBe(422);
    expect(foreignCursor.json().error.code).toBe("CURSOR_INVALID");

    const invalidLimit = await app.inject({
      method: "GET",
      url: "/api/v1/agenda?limit=0",
      headers: { cookie },
    });
    expect(invalidLimit.statusCode).toBe(422);
    expect(invalidLimit.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("melindungi mutasi admin dan mengaudit create, update, serta archive", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);
    const payload = {
      title: "Rapat persiapan kemerdekaan",
      date: "2099-08-10",
      startTime: "19:00",
      endTime: "20:30",
      location: "Balai Warga",
      description: "Koordinasi kegiatan lingkungan bersama pengurus dan warga.",
      organizer: "Pengurus RT",
    };

    const forbidden = await app.inject({
      method: "POST",
      url: "/api/v1/admin/agenda",
      headers: { cookie },
      payload,
    });
    expect(forbidden.statusCode).toBe(403);

    repository.setPermissions(demoIds.user, managedPermissions);
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/admin/agenda",
      headers: { cookie },
      payload,
    });
    expect(created.statusCode).toBe(201);
    expect(agendaMutationResponseSchema.safeParse(created.json()).success).toBe(true);
    const eventId = created.json().data.event.id as string;

    const invalidUpdate = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/agenda/${eventId}`,
      headers: { cookie },
      payload: { startTime: "23:00" },
    });
    expect(invalidUpdate.statusCode).toBe(422);
    expect(invalidUpdate.json().error.code).toBe("AGENDA_TIME_INVALID");

    const updated = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/agenda/${eventId}`,
      headers: { cookie },
      payload: { location: "Pendopo Komunitas" },
    });
    expect(updated.statusCode).toBe(200);
    expect(agendaMutationResponseSchema.safeParse(updated.json()).success).toBe(true);
    expect(updated.json().data.event.location).toBe("Pendopo Komunitas");

    const archived = await app.inject({
      method: "POST",
      url: `/api/v1/admin/agenda/${eventId}/archive`,
      headers: { cookie },
    });
    expect(archived.statusCode).toBe(200);
    expect(archiveAgendaEventResponseSchema.safeParse(archived.json()).success).toBe(true);

    const hidden = await app.inject({
      method: "GET",
      url: `/api/v1/agenda/${eventId}`,
      headers: { cookie },
    });
    expect(hidden.statusCode).toBe(404);
    expect(repository.audits.map((audit) => audit.action)).toEqual(
      expect.arrayContaining(["agenda.created", "agenda.updated", "agenda.archived"]),
    );
  });

  it("membatasi notifikasi ke pemilik dan menandai satu/semua secara idempoten", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/notifications?limit=1",
      headers: { cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(notificationListResponseSchema.safeParse(list.json()).success).toBe(true);
    expect(list.json().data.items).toHaveLength(1);
    expect(list.json().data.items[0].id).toBe(demoIds.notificationOne);

    const unreadBefore = await app.inject({
      method: "GET",
      url: "/api/v1/notifications/unread-count",
      headers: { cookie },
    });
    expect(notificationUnreadCountResponseSchema.safeParse(unreadBefore.json()).success).toBe(true);
    expect(unreadBefore.json().data.unreadCount).toBe(1);

    repository.setPermissions(demoIds.user, managedPermissions);
    const agendaWithNotification = await app.inject({
      method: "POST",
      url: "/api/v1/admin/agenda",
      headers: { cookie },
      payload: {
        title: "Agenda untuk pengujian notifikasi",
        date: "2099-08-11",
        startTime: "08:00",
        endTime: "09:00",
        location: "Balai Warga",
        description: "Agenda ini membuat notifikasi in-app nyata untuk warga aktif.",
        organizer: "Pengurus RT",
      },
    });
    expect(agendaWithNotification.statusCode).toBe(201);

    const paged = await app.inject({
      method: "GET",
      url: "/api/v1/notifications?limit=1",
      headers: { cookie },
    });
    expect(paged.json().meta.total).toBe(2);
    expect(paged.json().meta.nextCursor).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const firstRead = await app.inject({
      method: "POST",
      url: `/api/v1/notifications/${demoIds.notificationOne}/read`,
      headers: { cookie },
    });
    const repeatedRead = await app.inject({
      method: "POST",
      url: `/api/v1/notifications/${demoIds.notificationOne}/read`,
      headers: { cookie },
    });
    expect(markNotificationReadResponseSchema.safeParse(firstRead.json()).success).toBe(true);
    expect(repeatedRead.json().data.readAt).toBe(firstRead.json().data.readAt);

    const readAll = await app.inject({
      method: "POST",
      url: "/api/v1/notifications/read-all",
      headers: { cookie },
    });
    expect(markAllNotificationsReadResponseSchema.safeParse(readAll.json()).success).toBe(true);
    expect(readAll.json().data.updatedCount).toBe(1);
    expect(repository.audits.filter((audit) => audit.action === "notification.read")).toHaveLength(
      1,
    );
    expect(
      repository.audits.filter((audit) => audit.action === "notification.read_all"),
    ).toHaveLength(1);

    const foreignNotification = await app.inject({
      method: "POST",
      url: "/api/v1/notifications/60000000-0000-4000-8000-000000000001/read",
      headers: { cookie },
    });
    expect(foreignNotification.statusCode).toBe(404);
    expect(foreignNotification.json().error.code).toBe("NOTIFICATION_NOT_FOUND");
  });
});
