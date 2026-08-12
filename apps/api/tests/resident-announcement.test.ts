import {
  announcementDetailResponseSchema,
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
});
