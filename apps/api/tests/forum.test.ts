import {
  forumChannelListResponseSchema,
  forumChannelMemberListResponseSchema,
  forumChannelMutationResponseSchema,
  forumMemberCandidateListResponseSchema,
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

  it("menyembunyikan forum privat dari warga yang tidak diundang", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const owner = await loginWeb(app);
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/forum/channels",
      headers: { cookie: owner.cookie },
      payload: { name: "Panitia 17 Agustus", description: "Persiapan lomba" },
    });
    expect(created.statusCode).toBe(201);
    expect(forumChannelMutationResponseSchema.safeParse(created.json()).success).toBe(true);
    const channelId = created.json().data.channel.id as string;
    expect(created.json().data.channel.kind).toBe("PRIVATE");
    expect(created.json().data.channel.isOwner).toBe(true);

    // An uninvited warga must not see the forum at all, nor post into it.
    const outsider = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    const outsiderChannels = await app.inject({
      method: "GET",
      url: "/api/v1/forum/channels",
      headers: { cookie: outsider.cookie },
    });
    const outsiderIds = outsiderChannels.json().data.items.map((item: { id: string }) => item.id);
    expect(outsiderIds).not.toContain(channelId);

    const outsiderPost = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/messages`,
      headers: { cookie: outsider.cookie },
      payload: { body: "Menyusup" },
    });
    expect(outsiderPost.statusCode).toBe(404);
  });

  it("hanya membuka forum privat setelah undangan diterima", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const owner = await loginWeb(app);
    const candidates = await app.inject({
      method: "GET",
      url: "/api/v1/forum/member-candidates",
      headers: { cookie: owner.cookie },
    });
    expect(candidates.statusCode).toBe(200);
    expect(forumMemberCandidateListResponseSchema.safeParse(candidates.json()).success).toBe(true);
    const candidateIds = candidates
      .json()
      .data.items.map((item: { userId: string }) => item.userId);
    expect(candidateIds).toContain(demoIds.securityUser);
    expect(candidateIds).not.toContain(demoIds.user);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/forum/channels",
      headers: { cookie: owner.cookie },
      payload: { name: "Arisan Blok F", invitedUserIds: [demoIds.securityUser] },
    });
    const channelId = created.json().data.channel.id as string;

    const invitee = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);

    // Pending: the forum is listed as an invitation, but still unreadable.
    const pendingChannels = await app.inject({
      method: "GET",
      url: "/api/v1/forum/channels",
      headers: { cookie: invitee.cookie },
    });
    const pending = pendingChannels
      .json()
      .data.items.find((item: { id: string }) => item.id === channelId);
    expect(pending.membershipStatus).toBe("PENDING");
    const beforeAccept = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/messages`,
      headers: { cookie: invitee.cookie },
      payload: { body: "Belum diterima" },
    });
    expect(beforeAccept.statusCode).toBe(404);

    const accept = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/invitation`,
      headers: { cookie: invitee.cookie },
      payload: { accept: true },
    });
    expect(accept.statusCode).toBe(200);
    expect(accept.json().data.channel.membershipStatus).toBe("ACCEPTED");

    const afterAccept = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/messages`,
      headers: { cookie: invitee.cookie },
      payload: { body: "Halo semua" },
    });
    expect(afterAccept.statusCode).toBe(201);

    const members = await app.inject({
      method: "GET",
      url: `/api/v1/forum/channels/${channelId}/members`,
      headers: { cookie: owner.cookie },
    });
    expect(members.statusCode).toBe(200);
    expect(forumChannelMemberListResponseSchema.safeParse(members.json()).success).toBe(true);
    expect(members.json().data.items).toHaveLength(2);
  });

  it("menolak undangan menutup forum dari daftar channel warga tersebut", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const owner = await loginWeb(app);
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/forum/channels",
      headers: { cookie: owner.cookie },
      payload: { name: "Ronda Malam", invitedUserIds: [demoIds.securityUser] },
    });
    const channelId = created.json().data.channel.id as string;

    const invitee = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    const decline = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/invitation`,
      headers: { cookie: invitee.cookie },
      payload: { accept: false },
    });
    expect(decline.statusCode).toBe(200);
    expect(decline.json().data.channel.membershipStatus).toBe("DECLINED");

    const channels = await app.inject({
      method: "GET",
      url: "/api/v1/forum/channels",
      headers: { cookie: invitee.cookie },
    });
    const ids = channels.json().data.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(channelId);

    // Answering twice is not a way back in.
    const again = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/invitation`,
      headers: { cookie: invitee.cookie },
      payload: { accept: true },
    });
    expect(again.statusCode).toBe(404);
  });

  it("membalas dan mengedit pesan sendiri, menolak mengedit pesan orang lain", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const original = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Pesan asli" },
    });
    const originalId = original.json().data.message.id as string;

    const reply = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Balasan", replyToMessageId: originalId },
    });
    expect(reply.statusCode).toBe(201);
    expect(reply.json().data.message.replyToMessageId).toBe(originalId);
    expect(reply.json().data.message.replyToBody).toBe("Pesan asli");

    const edited = await app.inject({
      method: "PATCH",
      url: `/api/v1/forum/messages/${originalId}`,
      headers: { cookie: resident.cookie },
      payload: { body: "Pesan asli (diperbarui)" },
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().data.message.body).toBe("Pesan asli (diperbarui)");
    expect(edited.json().data.message.editedAt).toBeTruthy();

    // `forum.manage` lets a moderator take a message down, never rewrite it.
    const moderator = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post", "forum.manage"]);
    const foreignEdit = await app.inject({
      method: "PATCH",
      url: `/api/v1/forum/messages/${originalId}`,
      headers: { cookie: moderator.cookie },
      payload: { body: "Diubah orang lain" },
    });
    expect(foreignEdit.statusCode).toBe(404);
  });

  it("menolak balasan ke pesan yang tidak ada di channel tersebut", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const strayMessageId = "00000000-0000-4000-8000-0000000009f9";
    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${demoIds.forumChannelCommunity}/messages`,
      headers: { cookie: resident.cookie },
      payload: { body: "Balasan liar", replyToMessageId: strayMessageId },
    });
    expect(rejected.statusCode).toBe(404);
    expect(rejected.json().error.code).toBe("FORUM_MESSAGE_NOT_FOUND");
  });

  it("tidak pernah menampilkan nomor HP sebagai nama warga di forum", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    // Budi signed up but never set a display name; before this fix his phone
    // number was rendered as his name in the invite picker, the member list,
    // and on every message he posted.
    repository.clearDisplayName(demoIds.securityUser);

    const owner = await loginWeb(app);
    const candidates = await app.inject({
      method: "GET",
      url: "/api/v1/forum/member-candidates",
      headers: { cookie: owner.cookie },
    });
    const budi = candidates
      .json()
      .data.items.find((item: { userId: string }) => item.userId === demoIds.securityUser);
    expect(budi.displayName).toBe("Budi Santoso");
    expect(budi.houseLabel).toBe("Blok F No. 03");
    expect(JSON.stringify(candidates.json())).not.toContain("+62");

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/forum/channels",
      headers: { cookie: owner.cookie },
      payload: { name: "Kerja Bakti", invitedUserIds: [demoIds.securityUser] },
    });
    const channelId = created.json().data.channel.id as string;

    const members = await app.inject({
      method: "GET",
      url: `/api/v1/forum/channels/${channelId}/members`,
      headers: { cookie: owner.cookie },
    });
    expect(JSON.stringify(members.json())).not.toContain("+62");
    const memberBudi = members
      .json()
      .data.items.find((item: { userId: string }) => item.userId === demoIds.securityUser);
    expect(memberBudi.displayName).toBe("Budi Santoso");

    const invitee = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/invitation`,
      headers: { cookie: invitee.cookie },
      payload: { accept: true },
    });
    await app.inject({
      method: "POST",
      url: `/api/v1/forum/channels/${channelId}/messages`,
      headers: { cookie: invitee.cookie },
      payload: { body: "Siap, saya ikut." },
    });

    const messages = await app.inject({
      method: "GET",
      url: `/api/v1/forum/channels/${channelId}/messages`,
      headers: { cookie: owner.cookie },
    });
    expect(messages.json().data.items[0].authorName).toBe("Budi Santoso");
    expect(JSON.stringify(messages.json())).not.toContain("+62");
  });
});
