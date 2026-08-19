import {
  announcementDetailResponseSchema,
  archiveAnnouncementResponseSchema,
  announcementListResponseSchema,
  currentCommunityResponseSchema,
  homeResponseSchema,
  markAnnouncementReadResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("slice resident dan pengumuman", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("menyajikan current community dan home dari repository, bukan hitungan UI", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);

    const community = await app.inject({
      method: "GET",
      url: "/api/v1/communities/current",
      headers: { cookie },
    });
    expect(community.statusCode).toBe(200);
    expect(currentCommunityResponseSchema.safeParse(community.json()).success).toBe(true);
    expect(community.json().data.community.iqomahDelayMinutes).toBe(10);

    const home = await app.inject({
      method: "GET",
      url: "/api/v1/home",
      headers: { cookie },
    });
    expect(home.statusCode).toBe(200);
    expect(homeResponseSchema.safeParse(home.json()).success).toBe(true);
    expect(home.json().data.community.name).toBe("Billabong Blok F");
    expect(home.json().data.latestAnnouncements).toHaveLength(2);
    expect(home.json().data.unreadAnnouncementCount).toBe(2);
  });

  it("mendaftar, membaca detail, dan menandai pengumuman secara idempoten", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/announcements?limit=1",
      headers: { cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(announcementListResponseSchema.safeParse(list.json()).success).toBe(true);
    expect(list.json().data.items).toHaveLength(1);
    expect(list.json().meta.total).toBe(2);

    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/announcements/${demoIds.announcementOne}`,
      headers: { cookie },
    });
    expect(detail.statusCode).toBe(200);
    expect(announcementDetailResponseSchema.safeParse(detail.json()).success).toBe(true);

    const firstRead = await app.inject({
      method: "POST",
      url: `/api/v1/announcements/${demoIds.announcementOne}/read`,
      headers: { cookie },
    });
    const secondRead = await app.inject({
      method: "POST",
      url: `/api/v1/announcements/${demoIds.announcementOne}/read`,
      headers: { cookie },
    });
    expect(markAnnouncementReadResponseSchema.safeParse(firstRead.json()).success).toBe(true);
    expect(secondRead.json().data.readAt).toBe(firstRead.json().data.readAt);

    const home = await app.inject({
      method: "GET",
      url: "/api/v1/home",
      headers: { cookie },
    });
    expect(home.json().data.unreadAnnouncementCount).toBe(1);
  });

  it("mengembalikan 404 aman untuk pengumuman yang tidak terlihat", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/announcements/00000000-0000-4000-8000-999999999999",
      headers: { cookie },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("ANNOUNCEMENT_NOT_FOUND");
  });

  it("menyaring papan pengumuman per kategori, dengan Penting mengikuti prioritas", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const all = await app.inject({
      method: "GET",
      url: "/api/v1/announcements",
      headers: { cookie: resident.cookie },
    });
    expect(all.statusCode).toBe(200);
    expect(announcementListResponseSchema.safeParse(all.json()).success).toBe(true);
    expect(all.json().data.items).toHaveLength(2);

    // The demo board holds one IMPORTANT/INFO item and one NORMAL/EVENT item.
    const important = await app.inject({
      method: "GET",
      url: "/api/v1/announcements?filter=important",
      headers: { cookie: resident.cookie },
    });
    expect(important.json().data.items).toHaveLength(1);
    expect(important.json().data.items[0].priority).not.toBe("NORMAL");

    const events = await app.inject({
      method: "GET",
      url: "/api/v1/announcements?filter=event",
      headers: { cookie: resident.cookie },
    });
    expect(events.json().data.items).toHaveLength(1);
    expect(events.json().data.items[0].category).toBe("EVENT");

    // "Info" selects on the stored category, so the IMPORTANT/INFO item is
    // still filed under Info even though its badge reads "Penting".
    const info = await app.inject({
      method: "GET",
      url: "/api/v1/announcements?filter=info",
      headers: { cookie: resident.cookie },
    });
    expect(info.json().data.items).toHaveLength(1);
    expect(info.json().data.items[0].category).toBe("INFO");
  });

  it("menyimpan kategori dan gambar sampul saat pengurus membuat pengumuman", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const admin = await loginWeb(app);
    repository.setPermissions(demoIds.user, ["announcement.read", "announcement.manage"]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/announcements",
      headers: { cookie: admin.cookie },
      payload: {
        title: "Rapat Warga Bulanan",
        summary: "Evaluasi kegiatan RT dan rencana bulan depan.",
        body: "Mohon kehadiran Bapak/Ibu di balai warga pukul 19.30 WIB.",
        priority: "NORMAL",
        category: "EVENT",
        coverImageUrl: "https://example.test/rapat.jpg",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.announcement.category).toBe("EVENT");
    expect(created.json().data.announcement.coverImageUrl).toBe("https://example.test/rapat.jpg");

    const events = await app.inject({
      method: "GET",
      url: "/api/v1/announcements?filter=event",
      headers: { cookie: admin.cookie },
    });
    const titles = events.json().data.items.map((item: { title: string }) => item.title);
    expect(titles).toContain("Rapat Warga Bulanan");
  });

  it("mengizinkan pengurus mengedit lalu mengarsipkan pengumuman", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const admin = await loginWeb(app);
    repository.setPermissions(demoIds.user, ["announcement.read", "announcement.manage"]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/announcements",
      headers: { cookie: admin.cookie },
      payload: {
        title: "Kerja Bakti Lingkungan",
        summary: "Yuk, bersama-sama jaga kebersihan lingkungan kita.",
        body: "Kerja bakti dimulai pukul 07.00 WIB di balai warga.",
        category: "EVENT",
      },
    });
    const announcementId = created.json().data.announcement.id as string;

    const edited = await app.inject({
      method: "PATCH",
      url: `/api/v1/announcements/${announcementId}`,
      headers: { cookie: admin.cookie },
      payload: { title: "Kerja Bakti Lingkungan (diundur)", priority: "IMPORTANT" },
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().data.announcement.title).toBe("Kerja Bakti Lingkungan (diundur)");
    expect(edited.json().data.announcement.priority).toBe("IMPORTANT");
    // Untouched fields survive a partial edit.
    expect(edited.json().data.announcement.category).toBe("EVENT");

    const archived = await app.inject({
      method: "DELETE",
      url: `/api/v1/announcements/${announcementId}`,
      headers: { cookie: admin.cookie },
    });
    expect(archived.statusCode).toBe(200);
    expect(archiveAnnouncementResponseSchema.safeParse(archived.json()).success).toBe(true);

    // Archived notices drop off the board and can no longer be opened.
    const board = await app.inject({
      method: "GET",
      url: "/api/v1/announcements",
      headers: { cookie: admin.cookie },
    });
    const ids = board.json().data.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(announcementId);

    const gone = await app.inject({
      method: "GET",
      url: `/api/v1/announcements/${announcementId}`,
      headers: { cookie: admin.cookie },
    });
    expect(gone.statusCode).toBe(404);
  });

  it("menolak warga biasa mengedit atau menghapus pengumuman", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const edit = await app.inject({
      method: "PATCH",
      url: `/api/v1/announcements/${demoIds.announcementOne}`,
      headers: { cookie: resident.cookie },
      payload: { title: "Diubah warga biasa" },
    });
    expect(edit.statusCode).toBe(403);

    const remove = await app.inject({
      method: "DELETE",
      url: `/api/v1/announcements/${demoIds.announcementOne}`,
      headers: { cookie: resident.cookie },
    });
    expect(remove.statusCode).toBe(403);
  });
});
