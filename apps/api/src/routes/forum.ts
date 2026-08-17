import {
  createForumMessageInputSchema,
  forumMessageListQuerySchema,
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
  return { ...message, createdAt: message.createdAt.toISOString() };
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

  app.get(
    "/api/v1/forum/channels/:id/messages",
    { preHandler: readGuards },
    async (request) => {
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
    },
  );

  app.get("/api/v1/forum/channels/:id/stream", { preHandler: readGuards }, async (request, reply) => {
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
  });

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
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
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
