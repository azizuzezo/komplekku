import { endSecurityShiftInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository, SecurityShiftRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { requestUserAgent, responseMeta } from "../lib/http";

function publicShift(shift: SecurityShiftRecord) {
  return {
    id: shift.id,
    officerName: shift.officerName,
    status: shift.status,
    startedAt: shift.startedAt.toISOString(),
    endedAt: shift.endedAt?.toISOString() ?? null,
    notes: shift.notes,
  };
}

export async function registerSecurityShiftRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const guards = [authenticate, requirePermission("security.dashboard.read")];

  app.get("/api/v1/security/shift", { preHandler: guards }, async (request) => {
    const shift = await repository.getActiveSecurityShift(getAuthContext(request));
    return { data: { shift: shift ? publicShift(shift) : null }, meta: responseMeta(request) };
  });

  app.post("/api/v1/security/shift/start", { preHandler: guards }, async (request) => {
    const shift = await repository.startSecurityShift({
      auth: getAuthContext(request),
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return { data: { shift: publicShift(shift) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/security/shift/end", { preHandler: guards }, async (request) => {
    const input = endSecurityShiftInputSchema.parse(request.body ?? {});
    const shift = await repository.endSecurityShift({
      auth: getAuthContext(request),
      notes: input.notes,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return { data: { shift: shift ? publicShift(shift) : null }, meta: responseMeta(request) };
  });
}
