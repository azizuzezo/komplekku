import { notificationListQuerySchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, NotificationRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicNotification(notification: NotificationRecord) {
  return {
    ...notification,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function registerNotificationRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const guards = [authenticate, requirePermission("notification.read")];

  app.get("/api/v1/notifications", { preHandler: guards }, async (request) => {
    const query = notificationListQuerySchema.parse(request.query);
    const result = await repository.listNotifications({
      auth: getAuthContext(request),
      cursor: query.cursor,
      limit: query.limit,
    });
    if (result.outcome === "INVALID_CURSOR") {
      throw new AppError(422, "CURSOR_INVALID", "Kursor halaman tidak valid.");
    }
    return {
      data: { items: result.items.map(publicNotification) },
      meta: responseMeta(request, {
        total: result.total,
        ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      }),
    };
  });

  app.get("/api/v1/notifications/unread-count", { preHandler: guards }, async (request) => ({
    data: { unreadCount: await repository.getUnreadNotificationCount(getAuthContext(request)) },
    meta: responseMeta(request),
  }));

  app.post("/api/v1/notifications/read-all", { preHandler: guards }, async (request) => {
    const result = await repository.markAllNotificationsRead({
      auth: getAuthContext(request),
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return {
      data: { readAt: result.readAt.toISOString(), updatedCount: result.updatedCount },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/notifications/:id/read", { preHandler: guards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.markNotificationRead({
      auth: getAuthContext(request),
      notificationId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "NOT_FOUND") {
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notifikasi tidak ditemukan.");
    }
    return {
      data: { notificationId: result.notificationId, readAt: result.readAt.toISOString() },
      meta: responseMeta(request),
    };
  });
}
