import {
  createVisitorInputSchema,
  createWalkInVisitorInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, VisitorRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });
const qrTokenParamsSchema = z.object({ qrToken: z.string().min(1) });
const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });

function publicVisitor(visitor: VisitorRecord, includeQrToken: boolean) {
  return {
    id: visitor.id,
    guestName: visitor.guestName,
    guestPhone: visitor.guestPhone,
    visitDate: visitor.visitDate,
    expectedTime: visitor.expectedTime,
    vehicleInfo: visitor.vehicleInfo,
    plate: visitor.plate,
    purpose: visitor.purpose,
    notes: visitor.notes,
    status: visitor.status,
    isWalkIn: visitor.isWalkIn,
    houseCode: visitor.houseCode,
    householdDisplayName: visitor.householdDisplayName,
    checkedInAt: visitor.checkedInAt?.toISOString() ?? null,
    checkedOutAt: visitor.checkedOutAt?.toISOString() ?? null,
    createdAt: visitor.createdAt.toISOString(),
    ...(includeQrToken ? { qrToken: visitor.qrToken } : {}),
  };
}

export async function registerVisitorRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("visitor.create")];
  const readGuards = [authenticate, requirePermission("visitor.read")];
  const checkinGuards = [authenticate, requirePermission("visitor.checkin")];

  app.post("/api/v1/visitors", { preHandler: createGuards }, async (request, reply) => {
    const input = createVisitorInputSchema.parse(request.body);
    const result = await repository.createVisitor({
      auth: getAuthContext(request),
      visitor: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "HOUSEHOLD_CONTEXT_REQUIRED", "Rumah tangga aktif diperlukan.");
    }
    return reply
      .status(201)
      .send({ data: { visitor: publicVisitor(result.visitor, true) }, meta: responseMeta(request) });
  });

  app.post("/api/v1/visitors/walk-in", { preHandler: checkinGuards }, async (request, reply) => {
    const input = createWalkInVisitorInputSchema.parse(request.body);
    const result = await repository.createWalkInVisitor({
      auth: getAuthContext(request),
      visitor: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "HOUSE_NOT_FOUND") {
        throw new AppError(404, "HOUSE_NOT_FOUND", "Rumah tidak ditemukan.");
      }
      throw new AppError(404, "HOUSEHOLD_NOT_FOUND", "Rumah tangga tidak ditemukan.");
    }
    return reply
      .status(201)
      .send({ data: { visitor: publicVisitor(result.visitor, true) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/visitors", { preHandler: readGuards }, async (request) => {
    const query = listQuerySchema.parse(request.query);
    const auth = getAuthContext(request);
    const items = await repository.listVisitors({ auth, limit: query.limit });
    const includeQrToken = !auth.permissions.includes("visitor.checkin");
    return {
      data: { items: items.map((visitor) => publicVisitor(visitor, includeQrToken)) },
      meta: responseMeta(request),
    };
  });

  app.get(
    "/api/v1/visitors/lookup/:qrToken",
    { preHandler: checkinGuards },
    async (request) => {
      const { qrToken } = qrTokenParamsSchema.parse(request.params);
      const visitor = await repository.findVisitorByQrToken(getAuthContext(request), qrToken);
      return {
        data: { visitor: visitor ? publicVisitor(visitor, false) : null },
        meta: responseMeta(request),
      };
    },
  );

  app.post(
    "/api/v1/visitors/check-in/:qrToken",
    { preHandler: checkinGuards },
    async (request) => {
      const { qrToken } = qrTokenParamsSchema.parse(request.params);
      const result = await repository.checkInVisitor({
        auth: getAuthContext(request),
        qrToken,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome !== "OK") {
        if (result.outcome === "NOT_FOUND") {
          throw new AppError(404, "VISITOR_NOT_FOUND", "Tamu tidak ditemukan.");
        }
        throw new AppError(409, "VISITOR_INVALID_TRANSITION", "Tamu sudah diproses sebelumnya.");
      }
      return { data: { visitor: publicVisitor(result.visitor, false) }, meta: responseMeta(request) };
    },
  );

  app.post("/api/v1/visitors/:id/check-out", { preHandler: checkinGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.checkOutVisitor({
      auth: getAuthContext(request),
      visitorId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "VISITOR_NOT_FOUND", "Tamu tidak ditemukan.");
      }
      throw new AppError(409, "VISITOR_INVALID_TRANSITION", "Tamu belum check-in atau sudah keluar.");
    }
    return { data: { visitor: publicVisitor(result.visitor, false) }, meta: responseMeta(request) };
  });
}
