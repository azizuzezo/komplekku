import { createEmergencyInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, EmergencyRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });

function publicEmergency(emergency: EmergencyRecord) {
  return {
    id: emergency.id,
    kind: emergency.kind,
    status: emergency.status,
    houseLabel: emergency.houseLabel,
    senderName: emergency.senderName,
    note: emergency.note,
    sentAt: emergency.sentAt.toISOString(),
    acknowledgedAt: emergency.acknowledgedAt?.toISOString() ?? null,
    respondingAt: emergency.respondingAt?.toISOString() ?? null,
    resolvedAt: emergency.resolvedAt?.toISOString() ?? null,
  };
}

export async function registerEmergencyRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("emergency.create")];
  const readGuards = [authenticate, requirePermission("emergency.read")];
  const manageGuards = [authenticate, requirePermission("emergency.manage")];

  app.post("/api/v1/emergencies", { preHandler: createGuards }, async (request, reply) => {
    const input = createEmergencyInputSchema.parse(request.body);
    const emergency = await repository.createEmergency({
      auth: getAuthContext(request),
      kind: input.kind,
      note: input.note,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply
      .status(201)
      .send({ data: { emergency: publicEmergency(emergency) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/emergencies", { preHandler: readGuards }, async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await repository.listEmergencies(getAuthContext(request), query.limit);
    return {
      data: { items: items.map(publicEmergency) },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/emergencies/:id/acknowledge", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.acknowledgeEmergency({
      auth: getAuthContext(request),
      emergencyId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "EMERGENCY_NOT_FOUND", "Sinyal emergency tidak ditemukan.");
      }
      throw new AppError(409, "EMERGENCY_INVALID_TRANSITION", "Status emergency sudah berubah.");
    }
    return { data: { emergency: publicEmergency(result.emergency) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/emergencies/:id/respond", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.respondToEmergency({
      auth: getAuthContext(request),
      emergencyId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "EMERGENCY_NOT_FOUND", "Sinyal emergency tidak ditemukan.");
      }
      throw new AppError(409, "EMERGENCY_INVALID_TRANSITION", "Status emergency sudah berubah.");
    }
    return { data: { emergency: publicEmergency(result.emergency) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/emergencies/:id/resolve", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.resolveEmergency({
      auth: getAuthContext(request),
      emergencyId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "EMERGENCY_NOT_FOUND", "Sinyal emergency tidak ditemukan.");
      }
      throw new AppError(409, "EMERGENCY_INVALID_TRANSITION", "Status emergency sudah selesai.");
    }
    return { data: { emergency: publicEmergency(result.emergency) }, meta: responseMeta(request) };
  });
}
