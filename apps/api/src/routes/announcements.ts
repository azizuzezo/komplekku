import {
  announcementListQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository } from "../domain/repository";
import { announcementSummary } from "../lib/announcement-view";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import type { PushNotificationProvider } from "../lib/push-notification-provider";

const idParamsSchema = z.object({ id: z.string().uuid() });

export async function registerAnnouncementRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
  pushNotificationProvider?: PushNotificationProvider,
) {
  const guards = [authenticate, requirePermission("announcement.read")];

  app.get("/api/v1/announcements", { preHandler: guards }, async (request) => {
    const query = announcementListQuerySchema.parse(request.query);
    const result = await repository.listAnnouncements(
      getAuthContext(request),
      new Date(),
      query.limit,
      query.filter,
    );
    return {
      data: { items: result.items.map(announcementSummary) },
      meta: responseMeta(request, { total: result.total }),
    };
  });

  app.get("/api/v1/announcements/:id", { preHandler: guards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const announcement = await repository.getAnnouncement(getAuthContext(request), id, new Date());
    if (!announcement) {
      throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Pengumuman tidak ditemukan.");
    }
    return {
      data: {
        announcement: {
          ...announcementSummary(announcement),
          body: announcement.body,
        },
      },
      meta: responseMeta(request),
    };
  });

  app.post(
    "/api/v1/announcements",
    { preHandler: [authenticate, requirePermission("announcement.manage")] },
    async (request, reply) => {
      const input = createAnnouncementSchema.parse(request.body);
      const auth = getAuthContext(request);
      const created = await repository.createAnnouncement({
        auth,
        announcement: input,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });

      if (auth.currentCommunityId && pushNotificationProvider) {
        await pushNotificationProvider
          .broadcastToCommunity(auth.currentCommunityId, {
            title: `Pengumuman: ${created.title}`,
            body: created.summary,
            data: { type: "ANNOUNCEMENT", id: created.id },
          })
          .catch(() => {});
      }

      return reply.status(201).send({
        data: {
          announcement: {
            ...announcementSummary(created),
            body: created.body,
          },
        },
        meta: responseMeta(request),
      });
    },
  );

  app.patch(
    "/api/v1/announcements/:id",
    { preHandler: [authenticate, requirePermission("announcement.manage")] },
    async (request) => {
      const { id } = idParamsSchema.parse(request.params);
      const changes = updateAnnouncementSchema.parse(request.body);
      const result = await repository.updateAnnouncement({
        auth: getAuthContext(request),
        announcementId: id,
        changes,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome !== "OK") {
        throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Pengumuman tidak ditemukan.");
      }
      return {
        data: {
          announcement: {
            ...announcementSummary(result.announcement),
            body: result.announcement.body,
          },
        },
        meta: responseMeta(request),
      };
    },
  );

  /** Archives rather than erases: notifications already sent reference this
   * id, and the audit trail should still resolve it. */
  app.delete(
    "/api/v1/announcements/:id",
    { preHandler: [authenticate, requirePermission("announcement.manage")] },
    async (request) => {
      const { id } = idParamsSchema.parse(request.params);
      const result = await repository.archiveAnnouncement({
        auth: getAuthContext(request),
        announcementId: id,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome !== "OK") {
        throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Pengumuman tidak ditemukan.");
      }
      return {
        data: {
          announcementId: result.announcementId,
          archivedAt: result.archivedAt.toISOString(),
        },
        meta: responseMeta(request),
      };
    },
  );

  app.post("/api/v1/announcements/:id/read", { preHandler: guards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const readAt = await repository.markAnnouncementRead(getAuthContext(request), id, new Date());
    if (!readAt) {
      throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Pengumuman tidak ditemukan.");
    }
    return {
      data: { announcementId: id, readAt: readAt.toISOString() },
      meta: responseMeta(request),
    };
  });
}
