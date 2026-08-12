import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { responseMeta } from "../lib/http";

export async function registerSecurityDashboardRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  app.get(
    "/api/v1/security/dashboard",
    { preHandler: [authenticate, requirePermission("security.dashboard.read")] },
    async (request) => {
      const dashboard = await repository.getSecurityDashboard(getAuthContext(request), new Date());
      return {
        data: {
          activeShift: dashboard.activeShift
            ? {
                id: dashboard.activeShift.id,
                startedAt: dashboard.activeShift.startedAt.toISOString(),
              }
            : null,
          activeVisitorCount: dashboard.activeVisitorCount,
          pendingPackageCount: dashboard.pendingPackageCount,
          camerasOnline: dashboard.camerasOnline,
          camerasTotal: dashboard.camerasTotal,
          openEmergencyCount: dashboard.openEmergencyCount,
          activePatrolSession: dashboard.activePatrolSession
            ? {
                id: dashboard.activePatrolSession.id,
                startedAt: dashboard.activePatrolSession.startedAt.toISOString(),
                completedCheckpoints: dashboard.activePatrolSession.completedCheckpoints,
                totalCheckpoints: dashboard.activePatrolSession.totalCheckpoints,
              }
            : null,
        },
        meta: responseMeta(request),
      };
    },
  );
}
