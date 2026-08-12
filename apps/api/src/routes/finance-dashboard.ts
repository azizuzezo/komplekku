import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { responseMeta } from "../lib/http";

export async function registerFinanceDashboardRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  app.get(
    "/api/v1/finance/dashboard",
    { preHandler: [authenticate, requirePermission("finance.dashboard.read")] },
    async (request) => {
      const dashboard = await repository.getFinanceDashboard(getAuthContext(request), new Date());
      return { data: dashboard, meta: responseMeta(request) };
    },
  );
}
