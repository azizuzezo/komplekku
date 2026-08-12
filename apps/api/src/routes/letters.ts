import {
  createLetterRequestInputSchema,
  letterRequestListQuerySchema,
  rejectLetterRequestInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, LetterRequestRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicLetterRequest(request: LetterRequestRecord) {
  return {
    id: request.id,
    letterTypeId: request.letterTypeId,
    letterTypeName: request.letterTypeName,
    purpose: request.purpose,
    status: request.status,
    requesterName: request.requesterName,
    houseCode: request.houseCode,
    householdDisplayName: request.householdDisplayName,
    reviewedByName: request.reviewedByName,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    rejectionReason: request.rejectionReason,
    readyAt: request.readyAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
  };
}

export async function registerLetterRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("letter.create")];
  const readGuards = [authenticate, requirePermission("letter.read")];
  const manageGuards = [authenticate, requirePermission("letter.manage")];

  app.get("/api/v1/letter-types", { preHandler: readGuards }, async (request) => {
    const items = await repository.listLetterTypes(getAuthContext(request));
    return { data: { items }, meta: responseMeta(request) };
  });

  app.post("/api/v1/letters", { preHandler: createGuards }, async (request, reply) => {
    const input = createLetterRequestInputSchema.parse(request.body);
    const result = await repository.createLetterRequest({
      auth: getAuthContext(request),
      request: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "LETTER_TYPE_NOT_FOUND") {
        throw new AppError(404, "LETTER_TYPE_NOT_FOUND", "Jenis surat tidak ditemukan.");
      }
      throw new AppError(409, "HOUSEHOLD_CONTEXT_REQUIRED", "Rumah tangga aktif diperlukan.");
    }
    return reply.status(201).send({
      data: { request: publicLetterRequest(result.request) },
      meta: responseMeta(request),
    });
  });

  app.get("/api/v1/letters", { preHandler: readGuards }, async (request) => {
    const query = letterRequestListQuerySchema.parse(request.query);
    const items = await repository.listLetterRequests({
      auth: getAuthContext(request),
      status: query.status,
      limit: query.limit,
    });
    return { data: { items: items.map(publicLetterRequest) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/letters/:id/approve", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.approveLetterRequest({
      auth: getAuthContext(request),
      requestId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "LETTER_REQUEST_NOT_FOUND", "Permohonan surat tidak ditemukan.");
      }
      throw new AppError(
        409,
        "LETTER_REQUEST_INVALID_TRANSITION",
        "Status permohonan sudah berubah.",
      );
    }
    return { data: { request: publicLetterRequest(result.request) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/letters/:id/reject", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = rejectLetterRequestInputSchema.parse(request.body);
    const result = await repository.rejectLetterRequest({
      auth: getAuthContext(request),
      requestId: id,
      reason: input.reason,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "LETTER_REQUEST_NOT_FOUND", "Permohonan surat tidak ditemukan.");
      }
      throw new AppError(
        409,
        "LETTER_REQUEST_INVALID_TRANSITION",
        "Status permohonan sudah berubah.",
      );
    }
    return { data: { request: publicLetterRequest(result.request) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/letters/:id/ready", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.markLetterRequestReady({
      auth: getAuthContext(request),
      requestId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "LETTER_REQUEST_NOT_FOUND", "Permohonan surat tidak ditemukan.");
      }
      throw new AppError(
        409,
        "LETTER_REQUEST_INVALID_TRANSITION",
        "Status permohonan sudah berubah.",
      );
    }
    return { data: { request: publicLetterRequest(result.request) }, meta: responseMeta(request) };
  });
}
