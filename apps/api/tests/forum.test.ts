import {
  forumChannelListResponseSchema,
  forumMessageMutationResponseSchema,
  forumMessagePageResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("Forum Warga", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("membatasi daftar channel sesuai RT warga, selalu menyertakan channel komunitas", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    // demoIds.user lives in RT 01 (house F01).
    const resident = await loginWeb(app);
    const channels = await app.inject({
      method: "GET",
      url: "/api/v1/forum/channels",
      headers: { cookie: resident.cookie },
    });
    expect(channels.statusCode).toBe(200);
    expect(forumChannelListResponseSchema.safeParse(channels.json()).success).toBe(true);
    const ids = channels.json().data.items.map((item: { id: string }) => item.id);
    expect(ids).toContain(demoIds.forumChannelCommunity);
    expect(ids).toContain(demoIds.forumChannelRtOne);
    expect(ids).not.toContain(demoIds.forumChannelRtTwo);
  });

  it("menolak akses forum tanpa izin forum.read", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const resident = await loginWeb(app);
    repository.setPermissions(demoIds.user, ["home.read"]);
    const denied = await app.inject({
      method: "GET",
      url: "/api/v1/forum/channels",
      headers: { cookie: resident.cookie },
    });
    expect(denied.statusCode).toBe(403);
  });

  it("mengirim pesan di channel yang bisa diakses, menolak yang tidak", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const sent = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelRtOne}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Halo RT 01!" },
    });
    expect(sent.statusCode).toBe(201);
    expect(forumMessageMutationResponseSchema.safeParse(sent.json()).success).toBe(true);
    expect(sent.json().data.message.body).toBe("Halo RT 01!");

    const blocked = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelRtTwo}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Harusnya gagal" },
    });
    expect(blocked.statusCode).toBe(404);
    expect(blocked.json().error.code).toBe("FORUM_CHANNEL_NOT_FOUND");
  });

  it("memuat riwayat pesan channel komunitas dengan pagination", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Pesan pertama" },
    });
    await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Pesan kedua" },
    });

    const page = await app.inject({
      method: "GET",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages?limit=1`,
      headers: { cookie: resident.cookie },
    });
    expect(page.statusCode).toBe(200);
    expect(forumMessagePageResponseSchema.safeParse(page.json()).success).toBe(true);
    expect(page.json().data.items).toHaveLength(1);
    expect(page.json().data.items[0].body).toBe("Pesan kedua");
    expect(page.json().meta.nextCursor).toBeTruthy();
  });

  it("mengizinkan pengirim menghapus pesannya sendiri, menolak menghapus pesan orang lain tanpa forum.manage", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const sent = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Akan dihapus" },
    });
    const messageId = sent.json().data.message.id as string;

    // SECURITY has no forum access by default (operational roles use their
    // own dashboards, not the resident social forum) — grant read/post only
    // (no forum.manage) so this exercises the repository's ownership check,
    // not just the route's permission guard.
    const security = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    const forbiddenDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/forum/messages/${messageId}`,
      headers: { cookie: security.cookie },
    });
    expect(forbiddenDelete.statusCode).toBe(404);

    const ownDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/forum/messages/${messageId}`,
      headers: { cookie: resident.cookie },
    });
    expect(ownDelete.statusCode).toBe(200);
    expect(ownDelete.json().data.messageId).toBe(messageId);
  });

  it("membatasi moderasi RT_ADMIN yang di-scope RT lain agar tidak bisa menghapus pesan RT tetangga", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const superAdminPermissions = [
      "community.read",
      "community.manage",
      "resident.manage",
      "forum.read",
      "forum.post",
      "forum.manage",
    ];
    const superAdmin = await loginWeb(app);
    repository.setPermissions(demoIds.user, superAdminPermissions);

    // Scope demoIds.securityResident (house F03, RT 01) as RT_ADMIN of RT 02 —
    // deliberately mismatched from their own house, to isolate the
    // moderation-scope check from the personal-membership check.
    const promote = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: superAdmin.cookie },
      payload: { roleCode: "RT_ADMIN", rtId: demoIds.rtTwo },
    });
    expect(promote.statusCode).toBe(200);

    const rtTwoAdmin = await loginWeb(app, "0812 0000 0003");

    const posted = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelRtOne}/messages`,
      headers: { cookie: superAdmin.cookie },
      payload: { body: "Pesan warga RT 01" },
    });
    const rtOneMessageId = posted.json().data.message.id as string;

    const deniedCrossRt = await app.inject({
      method: "DELETE",
      url: `/api/v1/forum/messages/${rtOneMessageId}`,
      headers: { cookie: rtTwoAdmin.cookie },
    });
    expect(deniedCrossRt.statusCode).toBe(404);

    const postedInOwnRt = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelRtTwo}/messages`,
      headers: { cookie: superAdmin.cookie },
      payload: { body: "Pesan warga RT 02" },
    });
    const rtTwoMessageId = postedInOwnRt.json().data.message.id as string;

    const allowedOwnRt = await app.inject({
      method: "DELETE",
      url: `/api/v1/forum/messages/${rtTwoMessageId}`,
      headers: { cookie: rtTwoAdmin.cookie },
    });
    expect(allowedOwnRt.statusCode).toBe(200);
  });
});
