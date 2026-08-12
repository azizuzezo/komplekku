import {
  agendaListQuerySchema,
  createAgendaEventInputSchema,
  updateAgendaEventInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AgendaMutationResult, AppRepository } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function agendaMutationError(result: AgendaMutationResult): never {
  if (result.outcome === "NOT_FOUND") {
    throw new AppError(404, "AGENDA_NOT_FOUND", "Agenda tidak ditemukan.");
  }
  if (result.outcome === "ARCHIVED") {
    throw new AppError(409, "AGENDA_ARCHIVED", "Agenda yang sudah diarsipkan tidak dapat diubah.");
  }
  throw new AppError(422, "AGENDA_TIME_INVALID", "Waktu selesai harus setelah waktu mulai.");
}

export async function registerAgendaRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const readGuards = [authenticate, requirePermission("agenda.read")];
  const manageGuards = [authenticate, requirePermission("agenda.manage")];

  app.get("/api/v1/agenda", { preHandler: readGuards }, async (request) => {
    const query = agendaListQuerySchema.parse(request.query);
    const result = await repository.listAgenda({
      auth: getAuthContext(request),
      now: new Date(),
      view: query.view,
      cursor: query.cursor,
      limit: query.limit,
    });
    if (result.outcome === "INVALID_CURSOR") {
      throw new AppError(422, "CURSOR_INVALID", "Kursor halaman tidak valid.");
    }
    return {
      data: { view: query.view, items: result.items },
      meta: responseMeta(request, {
        total: result.total,
        ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      }),
    };
  });

  app.get("/api/v1/agenda/:id", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const event = await repository.getAgendaEvent(getAuthContext(request), id);
    if (!event) throw new AppError(404, "AGENDA_NOT_FOUND", "Agenda tidak ditemukan.");
    return { data: { event }, meta: responseMeta(request) };
  });

  app.post("/api/v1/admin/agenda", { preHandler: manageGuards }, async (request, reply) => {
    const event = createAgendaEventInputSchema.parse(request.body);
    const result = await repository.createAgendaEvent({
      auth: getAuthContext(request),
      event,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") agendaMutationError(result);
    return reply.status(201).send({ data: { event: result.event }, meta: responseMeta(request) });
  });

  app.patch("/api/v1/admin/agenda/:id", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const changes = updateAgendaEventInputSchema.parse(request.body);
    const result = await repository.updateAgendaEvent({
      auth: getAuthContext(request),
      eventId: id,
      changes,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") agendaMutationError(result);
    return { data: { event: result.event }, meta: responseMeta(request) };
  });

  app.post("/api/v1/admin/agenda/:id/archive", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.archiveAgendaEvent({
      auth: getAuthContext(request),
      eventId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "NOT_FOUND") {
      throw new AppError(404, "AGENDA_NOT_FOUND", "Agenda tidak ditemukan.");
    }
    return {
      data: { eventId: result.eventId, archivedAt: result.archivedAt.toISOString() },
      meta: responseMeta(request),
    };
  });
}
