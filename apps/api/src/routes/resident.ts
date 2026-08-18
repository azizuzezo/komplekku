import { updateProfileInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository } from "../domain/repository";
import { announcementSummary } from "../lib/announcement-view";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { responseMeta } from "../lib/http";
import { firstName, maskPhone } from "../lib/security";

export async function registerResidentRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  app.get("/api/v1/me", { preHandler: authenticate }, async (request) => {
    const auth = getAuthContext(request);
    const me = await repository.getMe(auth);
    if (!me) throw new AppError(404, "USER_NOT_FOUND", "Data akun tidak ditemukan.");
    return {
      data: {
        id: me.id,
        displayName: me.displayName,
        phoneMasked: maskPhone(me.phoneE164),
        allowResidentContact: me.allowResidentContact,
        authState: me.authState,
        residentStatus: me.residentStatus,
        currentContext: me.currentContext,
        permissions: me.permissions,
      },
      meta: responseMeta(request),
    };
  });

  app.patch("/api/v1/me", { preHandler: authenticate }, async (request) => {
    const auth = getAuthContext(request);
    const input = updateProfileInputSchema.parse(request.body);
    const updated = await repository.updateProfile({ auth, profile: input });
    return {
      data: updated,
      meta: responseMeta(request),
    };
  });

  app.get(
    "/api/v1/communities/current",
    { preHandler: [authenticate, requirePermission("community.read")] },
    async (request) => {
      const community = await repository.getCurrentCommunity(getAuthContext(request));
      if (!community) {
        throw new AppError(409, "COMMUNITY_CONTEXT_REQUIRED", "Pilih komunitas terlebih dahulu.");
      }
      return {
        data: { community },
        meta: responseMeta(request),
      };
    },
  );

  app.get(
    "/api/v1/home",
    { preHandler: [authenticate, requirePermission("home.read")] },
    async (request) => {
      const home = await repository.getHome(getAuthContext(request), new Date());
      if (!home) {
        throw new AppError(403, "RESIDENCY_NOT_ACTIVE", "Akun warga belum aktif untuk rumah ini.");
      }
      return {
        data: {
          viewer: {
            displayName: home.viewerName,
            firstName: firstName(home.viewerName),
          },
          community: home.community,
          household: home.household,
          latestAnnouncements: home.latestAnnouncements.map(announcementSummary),
          unreadAnnouncementCount: home.unreadAnnouncementCount,
        },
        meta: responseMeta(request),
      };
    },
  );
}
