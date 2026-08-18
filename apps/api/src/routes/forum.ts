import {
  createForumChannelInputSchema,
  createForumMessageInputSchema,
  forumMessageListQuerySchema,
  inviteForumMembersInputSchema,
  respondForumInvitationInputSchema,
  updateForumMessageInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, ForumMessageRecord } from "../domain/repository";
import { forumBroadcaster } from "../lib/forum-broadcaster";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import type { PushNotificationProvider } from "../lib/push-notification-provider";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicMessage(message: ForumMessageRecord) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
  };
}

export async function registerForumRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
  pushNotificationProvider?: PushNotificationProvider,
) {
  const readGuards = [authenticate, requirePermission("forum.read")];
  const postGuards = [authenticate, requirePermission("forum.post")];

  app.get("/api/v1/forum/channels", { preHandler: readGuards }, async (request) => ({
    data: { items: await repository.listForumChannels(getAuthContext(request)) },
    meta: responseMeta(request),
  }));

  // Opening a forum is a posting action, not a moderation one: any warga who
  // may speak in the forum may start one and invite the neighbours they want.
  app.post("/api/v1/forum/channels", { preHandler: postGuards }, async (request, reply) => {
    const input = createForumChannelInputSchema.parse(request.body);
    const auth = getAuthContext(request);
    const result = await repository.createForumChannel({
      auth,
      name: input.name,
      description: input.description,
      invitedUserIds: input.invitedUserIds,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "FORUM_NO_COMMUNITY", "Akunmu belum terhubung ke komunitas.");
    }

    if (pushNotificationProvider && result.invitedUserIds.length > 0) {
      await pushNotificationProvider
        .sendToUsers(result.invitedUserIds, {
          title: "Undangan forum baru",
          body: `Kamu diundang ke forum "${result.channel.name}".`.slice(0, 160),
          data: { type: "FORUM_INVITATION", channelId: result.channel.id },
        })
        .catch(() => {});
    }

    return reply
      .status(201)
      .send({ data: { channel: result.channel }, meta: responseMeta(request) });
  });

  /** Residents who can be invited into a private forum. */
  app.get("/api/v1/forum/member-candidates", { preHandler: postGuards }, async (request) => ({
    data: { items: await repository.listForumMemberCandidates(getAuthContext(request)) },
    meta: responseMeta(request),
  }));

  app.get("/api/v1/forum/channels/:id/members", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.listForumChannelMembers({
      auth: getAuthContext(request),
      channelId: id,
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_CHANNEL_NOT_FOUND", "Channel forum tidak ditemukan.");
    }
    return { data: { items: result.items }, meta: responseMeta(request) };
  });

  app.post(
    "/api/v1/forum/channels/:id/invitations",
    { preHandler: postGuards },
    async (request) => {
      const { id } = idParamsSchema.parse(request.params);
      const input = inviteForumMembersInputSchema.parse(request.body);
      const result = await repository.inviteForumMembers({
        auth: getAuthContext(request),
        channelId: id,
        userIds: input.userIds,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome === "CHANNEL_NOT_FOUND") {
        throw new AppError(404, "FORUM_CHANNEL_NOT_FOUND", "Channel forum tidak ditemukan.");
      }
      if (result.outcome === "FORBIDDEN") {
        throw new AppError(
          403,
          "FORUM_INVITE_FORBIDDEN",
          "Terima undangan forum ini dulu sebelum mengundang warga lain.",
        );
      }

      if (pushNotificationProvider && result.invitedUserIds.length > 0) {
        await pushNotificationProvider
          .sendToUsers(result.invitedUserIds, {
            title: "Undangan forum baru",
            body: `Kamu diundang ke forum "${result.channel.name}".`.slice(0, 160),
            data: { type: "FORUM_INVITATION", channelId: result.channel.id },
          })
          .catch(() => {});
      }

      return { data: { channel: result.channel }, meta: responseMeta(request) };
    },
  );

  /** Accept or decline an invitation. Guarded by `forum.read` rather than
   * `forum.post` — answering an invitation is not posting. */
  app.post("/api/v1/forum/channels/:id/invitation", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = respondForumInvitationInputSchema.parse(request.body);
    const result = await repository.respondToForumInvitation({
      auth: getAuthContext(request),
      channelId: id,
      accept: input.accept,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_INVITATION_NOT_FOUND", "Undangan forum tidak ditemukan.");
    }
    return { data: { channel: result.channel }, meta: responseMeta(request) };
  });

  app.get("/api/v1/forum/channels/:id/messages", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const query = forumMessageListQuerySchema.parse(request.query);
    const result = await repository.listForumMessages({
      auth: getAuthContext(request),
      channelId: id,
      cursor: query.cursor,
      limit: query.limit,
    });
    if (result.outcome === "INVALID_CURSOR") {
      throw new AppError(422, "CURSOR_INVALID", "Kursor halaman tidak valid.");
    }
    return {
      data: { items: result.items.map(publicMessage) },
      meta: responseMeta(request, {
        total: result.total,
        ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      }),
    };
  });

  app.get(
    "/api/v1/forum/channels/:id/stream",
    { preHandler: readGuards },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      // Confirm the caller can actually see this channel before opening the
      // stream — reuses the same access check as listing messages, just
      // discarding the page of history.
      const access = await repository.listForumMessages({
        auth: getAuthContext(request),
        channelId: id,
        limit: 1,
      });
      if (access.outcome === "INVALID_CURSOR") {
        throw new AppError(422, "CURSOR_INVALID", "Kursor halaman tidak valid.");
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      reply.raw.write(": connected\n\n");

      const unsubscribe = forumBroadcaster.subscribe(id, reply.raw);
      request.raw.on("close", unsubscribe);
      await new Promise<void>((resolve) => {
        request.raw.on("close", resolve);
      });
    },
  );

  app.post(
    "/api/v1/forum/channels/:id/messages",
    { preHandler: postGuards },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const input = createForumMessageInputSchema.parse(request.body);
      const auth = getAuthContext(request);
      const result = await repository.createForumMessage({
        auth,
        channelId: id,
        body: input.body,
        imageUrls: input.imageUrls,
        replyToMessageId: input.replyToMessageId,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome === "REPLY_NOT_FOUND") {
        throw new AppError(404, "FORUM_MESSAGE_NOT_FOUND", "Pesan yang dibalas tidak ditemukan.");
      }
      if (result.outcome !== "OK") {
        throw new AppError(404, "FORUM_CHANNEL_NOT_FOUND", "Channel forum tidak ditemukan.");
      }

      forumBroadcaster.emit({
        type: "message.created",
        channelId: id,
        messageId: result.message.id,
      });

      if (pushNotificationProvider && result.recipientUserIds.length > 0) {
        await pushNotificationProvider
          .sendToUsers(result.recipientUserIds, {
            title: `Pesan baru di Forum Warga`,
            body: `${result.message.authorName}: ${result.message.body}`.slice(0, 160),
            data: { type: "FORUM_MESSAGE", channelId: id },
          })
          .catch(() => {});
      }

      return reply
        .status(201)
        .send({ data: { message: publicMessage(result.message) }, meta: responseMeta(request) });
    },
  );

  app.patch("/api/v1/forum/messages/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = updateForumMessageInputSchema.parse(request.body);
    const result = await repository.updateForumMessage({
      auth: getAuthContext(request),
      messageId: id,
      body: input.body,
      imageUrls: input.imageUrls,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "FORUM_MESSAGE_NOT_FOUND", "Pesan forum tidak ditemukan.");
    }

    forumBroadcaster.emit({
      type: "message.updated",
      channelId: result.channelId,
      messageId: result.message.id,
    });

    return { data: { message: publicMessage(result.message) }, meta: responseMeta(request) };
  });

  app.delete("/api/v1/forum/messages/:id", { preHandler: postGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const auth = getAuthContext(request);
    const result = await repository.deleteForumMessage({
      auth,
      messageId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "DELETED") {
      throw new AppError(404, "FORUM_MESSAGE_NOT_FOUND", "Pesan forum tidak ditemukan.");
    }
    forumBroadcaster.emit({
      type: "message.deleted",
      channelId: result.channelId,
      messageId: result.messageId,
    });
    return { data: { messageId: result.messageId }, meta: responseMeta(request) };
  });
}
