import {
  forumLikeResponseSchema,
  forumPostDetailResponseSchema,
  forumPostListResponseSchema,
  forumPostMutationResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

/** Creates a post as the given session and returns its id. */
async function createPost(
  app: Awaited<ReturnType<typeof createTestApp>>["app"],
  cookie: string,
  overrides: Record<string, unknown> = {},
) {
  const created = await app.inject({
    method: "POST",
    url: "/api/v1/forum/posts",
    headers: { cookie },
    payload: {
      category: "QUESTION",
      title: "Rekomendasi tukang bangunan terpercaya",
      body: "Warga sekalian, ada yang bisa merekomendasikan tukang yang rapi dan jujur?",
      ...overrides,
    },
  });
  expect(created.statusCode).toBe(201);
  return created.json().data.post.id as string;
}

describe("Papan diskusi Forum Warga", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("membuat diskusi berjudul dan menampilkannya di papan", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/forum/posts",
      headers: { cookie: resident.cookie },
      payload: {
        category: "SUGGESTION",
        title: "Usulan pemasangan CCTV di lingkungan RT",
        body: "Saya mengusulkan pemasangan CCTV di beberapa titik strategis seperti pintu masuk utama.",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(forumPostMutationResponseSchema.safeParse(created.json()).success).toBe(true);
    expect(created.json().data.post.category).toBe("SUGGESTION");
    expect(created.json().data.post.replyCount).toBe(0);
    expect(created.json().data.post.likeCount).toBe(0);
    expect(created.json().data.post.likedByMe).toBe(false);
    // The card on the board shows an excerpt, not the whole body.
    expect(created.json().data.post.excerpt).toContain("pemasangan CCTV");

    const board = await app.inject({
      method: "GET",
      url: "/api/v1/forum/posts",
      headers: { cookie: resident.cookie },
    });
    expect(board.statusCode).toBe(200);
    expect(forumPostListResponseSchema.safeParse(board.json()).success).toBe(true);
    expect(board.json().data.items).toHaveLength(1);
  });

  it("menyaring papan per kategori dan menyembunyikan yang belum terjawab", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const answered = await createPost(app, resident.cookie, { category: "QUESTION" });
    await createPost(app, resident.cookie, {
      category: "INFORMATION",
      title: "Kehilangan kunci motor di depan masjid",
      body: "Tadi malam sekitar jam 20.00 kehilangan kunci motor Honda Beat warna hitam.",
    });

    await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${answered}/replies`,
      headers: { cookie: resident.cookie },
      payload: { body: "Saya tahu satu, nanti saya kirim kontaknya." },
    });

    const byCategory = await app.inject({
      method: "GET",
      url: "/api/v1/forum/posts?category=INFORMATION",
      headers: { cookie: resident.cookie },
    });
    expect(byCategory.json().data.items).toHaveLength(1);
    expect(byCategory.json().data.items[0].category).toBe("INFORMATION");

    // "Terjawab" filters rather than reorders — a question nobody answered
    // must not show up there.
    const answeredOnly = await app.inject({
      method: "GET",
      url: "/api/v1/forum/posts?sort=answered",
      headers: { cookie: resident.cookie },
    });
    expect(answeredOnly.json().data.items).toHaveLength(1);
    expect(answeredOnly.json().data.items[0].id).toBe(answered);
    expect(answeredOnly.json().data.items[0].replyCount).toBe(1);
  });

  it("menyukai dan membatalkan suka, dihitung per orang", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const author = await loginWeb(app);
    const postId = await createPost(app, author.cookie);

    const liked = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postId}/like`,
      headers: { cookie: author.cookie },
    });
    expect(liked.statusCode).toBe(200);
    expect(forumLikeResponseSchema.safeParse(liked.json()).success).toBe(true);
    expect(liked.json().data).toEqual({ likeCount: 1, likedByMe: true });

    // A second warga's like adds to the count without changing the first
    // viewer's own state.
    const other = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    const secondLike = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postId}/like`,
      headers: { cookie: other.cookie },
    });
    expect(secondLike.json().data).toEqual({ likeCount: 2, likedByMe: true });

    const unliked = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postId}/like`,
      headers: { cookie: author.cookie },
    });
    expect(unliked.json().data).toEqual({ likeCount: 1, likedByMe: false });

    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: author.cookie },
    });
    expect(forumPostDetailResponseSchema.safeParse(detail.json()).success).toBe(true);
    expect(detail.json().data.post.likeCount).toBe(1);
    expect(detail.json().data.post.likedByMe).toBe(false);
  });

  it("membalas diskusi, mengutip balasan lain, dan menyukai balasan", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const author = await loginWeb(app);
    const postId = await createPost(app, author.cookie);

    const firstReply = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postId}/replies`,
      headers: { cookie: author.cookie },
      payload: { body: "Setuju, keamanan lingkungan memang perlu ditingkatkan." },
    });
    expect(firstReply.statusCode).toBe(201);
    const firstReplyId = firstReply.json().data.reply.id as string;

    const other = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, ["forum.read", "forum.post"]);
    const quoted = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postId}/replies`,
      headers: { cookie: other.cookie },
      payload: {
        body: "Betul, bisa ditambahkan estimasi biayanya.",
        replyToReplyId: firstReplyId,
      },
    });
    expect(quoted.statusCode).toBe(201);
    expect(quoted.json().data.reply.replyToReplyId).toBe(firstReplyId);
    expect(quoted.json().data.reply.replyToBody).toContain("Setuju");

    const replyLike = await app.inject({
      method: "POST",
      url: `/api/v1/forum/replies/${firstReplyId}/like`,
      headers: { cookie: other.cookie },
    });
    expect(replyLike.json().data).toEqual({ likeCount: 1, likedByMe: true });

    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: author.cookie },
    });
    expect(detail.json().data.post.replies).toHaveLength(2);
    expect(detail.json().data.post.replyCount).toBe(2);
  });

  it("menolak kutipan balasan dari diskusi lain", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const postA = await createPost(app, resident.cookie);
    const postB = await createPost(app, resident.cookie, {
      title: "Ide kegiatan anak saat libur sekolah",
      body: "Ada usulan kegiatan positif untuk anak-anak saat libur sekolah?",
    });

    const replyOnA = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postA}/replies`,
      headers: { cookie: resident.cookie },
      payload: { body: "Balasan di diskusi A." },
    });
    const replyOnAId = replyOnA.json().data.reply.id as string;

    // Quoting across discussions would let a crafted id pull text out of a
    // thread the reader is not looking at.
    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/forum/posts/${postB}/replies`,
      headers: { cookie: resident.cookie },
      payload: { body: "Kutipan lintas diskusi.", replyToReplyId: replyOnAId },
    });
    expect(rejected.statusCode).toBe(404);
    expect(rejected.json().error.code).toBe("FORUM_REPLY_NOT_FOUND");
  });

  it("mengizinkan penulis mengedit, moderator menghapus, tapi bukan sebaliknya", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const author = await loginWeb(app);
    const postId = await createPost(app, author.cookie);

    const edited = await app.inject({
      method: "PATCH",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: author.cookie },
      payload: { title: "Rekomendasi tukang bangunan (diperbarui)" },
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().data.post.title).toBe("Rekomendasi tukang bangunan (diperbarui)");
    expect(edited.json().data.post.editedAt).toBeTruthy();

    const moderator = await loginWeb(app, "0812 0000 0003");
    repository.setPermissions(demoIds.securityUser, [
      "forum.read",
      "forum.post",
      "forum.manage",
    ]);

    // `forum.manage` takes a post down; it never rewrites someone else's words.
    const foreignEdit = await app.inject({
      method: "PATCH",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: moderator.cookie },
      payload: { title: "Diubah orang lain" },
    });
    expect(foreignEdit.statusCode).toBe(404);

    const moderatorDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: moderator.cookie },
    });
    expect(moderatorDelete.statusCode).toBe(200);

    const gone = await app.inject({
      method: "GET",
      url: `/api/v1/forum/posts/${postId}`,
      headers: { cookie: author.cookie },
    });
    expect(gone.statusCode).toBe(404);
  });

  it("menolak papan diskusi tanpa izin forum.read", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    repository.setPermissions(demoIds.user, ["home.read"]);

    const denied = await app.inject({
      method: "GET",
      url: "/api/v1/forum/posts",
      headers: { cookie: resident.cookie },
    });
    expect(denied.statusCode).toBe(403);
  });
});
