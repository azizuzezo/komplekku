import {
  createForumPostInputSchema,
  createForumPostReplyInputSchema,
  forumPostListQuerySchema,
  updateForumPostInputSchema,
  updateForumPostReplyInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type {
  AppRepository,
  ForumPostReplyRecord,
  ForumPostSummaryRecord,
} from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import type { PushNotificationProvider } from "../lib/push-notification-provider";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicPost(post: ForumPostSummaryRecord) {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    editedAt: post.editedAt?.toISOString() ?? null,
  };
}

function publicReply(reply: ForumPostReplyRecord) {
  return {
    ...reply,
    createdAt: reply.createdAt.toISOString(),
    editedAt: reply.editedAt?.toISOString() ?? null,
  };
}

/**
 * The threaded "Forum Warga" board.
 *
 * Registered separately from `forum.ts` because the two are different products
 * sharing one feature name: chat channels are realtime and (for private ones)
 * invitation-scoped, while the board is community-wide, titled, and threaded.
 * They share the `forum.read` / `forum.post` / `forum.manage` permissions, so
 * no RBAC change was needed.
 */
export async function registerForumPostRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
  pushNotificationProvider?: PushNotificationProvider,
) {
  const readGuards = [authenticate, requirePermission("forum.read")];
  const postGuards = [authenticate, requirePermission("forum.post")];

  app.get("/api/v1/forum/posts", { preHandler: readGuards }, async (request) => {
    const query = forumPostListQuerySchema.parse(request.query);
    const items = await repository.listForumPosts({
      auth: getAuthContext(request),
      sort: query.sort,
      category: query.category,
      limit: query.limit,
    });
    return { data: { items: items.map(publicPost) }, meta: responseMeta(request) };
  });

  app.get("/api/v1/forum/posts/:id", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const post = await repository.getForumPost(getAuthContext(request), id);
    if (!post) throw new AppError(404, "FORUM_POST_NOT_FOUND", "Diskusi tidak ditemukan.");
    return {
      data: {
        post: {
          ...publicPost(post),
          body: post.body,
          replies: post.replies.map(publicReply),
        },
      },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/forum/posts", { preHandler: postGuards }, async (request, reply) => {
    const input = createForumPostInputSchema.parse(request.body);
    const result = await repository.createForumPost({
      auth: getAuthContext(request),
      category: input.category,
      title: input.title,
      body: input.body,
      imageUrls: input.imageUrls,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "FORUM_NO_COMMUNITY", "Akunmu belum terhubung ke komunitas.");
    }

    if (pushNotificationProvider && result.recipientUserIds.length > 0) {
      await pushNotificationProvider
        .sendToUsers(result.recipientUserIds, {
          title: "Diskusi baru di Forum Warga",
          body: `${result.post.authorName}: ${result.post.title}`.slice(0, 160),
          data: { type: "FORUM_POST", postId: result.post.id },
        })
        .catch(() => {});
    }

    return reply
      .status(201)
      .send({ data: { post: publicPost(result.post) }, meta: responseMeta(request) });
  });

  app.patch("/api/v1/forum/posts/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const changes = updateForumPostInputSchema.parse(request.body);
    const result = await repository.updateForumPost({
      auth: getAuthContext(request),
      postId: id,
      changes,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_POST_NOT_FOUND", "Diskusi tidak ditemukan.");
    }
    return { data: { post: publicPost(result.post) }, meta: responseMeta(request) };
  });

  app.delete("/api/v1/forum/posts/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.deleteForumPost({
      auth: getAuthContext(request),
      postId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "DELETED") {
      throw new AppError(404, "FORUM_POST_NOT_FOUND", "Diskusi tidak ditemukan.");
    }
    return { data: { postId: id }, meta: responseMeta(request) };
  });

  /** Toggles the viewer's like. Guarded by `forum.read` — liking is not
   * posting, and a warga who can read the board can react to it. */
  app.post("/api/v1/forum/posts/:id/like", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.toggleForumPostLike({
      auth: getAuthContext(request),
      postId: id,
      now: new Date(),
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_POST_NOT_FOUND", "Diskusi tidak ditemukan.");
    }
    return {
      data: { likeCount: result.likeCount, likedByMe: result.likedByMe },
      meta: responseMeta(request),
    };
  });

  app.post(
    "/api/v1/forum/posts/:id/replies",
    { preHandler: postGuards },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const input = createForumPostReplyInputSchema.parse(request.body);
      const result = await repository.createForumPostReply({
        auth: getAuthContext(request),
        postId: id,
        body: input.body,
        replyToReplyId: input.replyToReplyId,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome === "REPLY_NOT_FOUND") {
        throw new AppError(404, "FORUM_REPLY_NOT_FOUND", "Balasan yang dikutip tidak ditemukan.");
      }
      if (result.outcome !== "OK") {
        throw new AppError(404, "FORUM_POST_NOT_FOUND", "Diskusi tidak ditemukan.");
      }

      if (pushNotificationProvider && result.recipientUserIds.length > 0) {
        await pushNotificationProvider
          .sendToUsers(result.recipientUserIds, {
            title: "Balasan baru di Forum Warga",
            body: `${result.reply.authorName}: ${result.reply.body}`.slice(0, 160),
            data: { type: "FORUM_POST_REPLY", postId: id },
          })
          .catch(() => {});
      }

      return reply
        .status(201)
        .send({ data: { reply: publicReply(result.reply) }, meta: responseMeta(request) });
    },
  );

  app.patch("/api/v1/forum/replies/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = updateForumPostReplyInputSchema.parse(request.body);
    const result = await repository.updateForumPostReply({
      auth: getAuthContext(request),
      replyId: id,
      body: input.body,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_REPLY_NOT_FOUND", "Balasan tidak ditemukan.");
    }
    return { data: { reply: publicReply(result.reply) }, meta: responseMeta(request) };
  });

  app.delete("/api/v1/forum/replies/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.deleteForumPostReply({
      auth: getAuthContext(request),
      replyId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "DELETED") {
      throw new AppError(404, "FORUM_REPLY_NOT_FOUND", "Balasan tidak ditemukan.");
    }
    return { data: { replyId: id }, meta: responseMeta(request) };
  });

  app.post("/api/v1/forum/replies/:id/like", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.toggleForumReplyLike({
      auth: getAuthContext(request),
      replyId: id,
      now: new Date(),
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_REPLY_NOT_FOUND", "Balasan tidak ditemukan.");
    }
    return {
      data: { likeCount: result.likeCount, likedByMe: result.likedByMe },
      meta: responseMeta(request),
    };
  });
}
