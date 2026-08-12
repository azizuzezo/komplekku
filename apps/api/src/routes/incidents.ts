import {
  createIncidentInputSchema,
  incidentListQuerySchema,
  updateIncidentInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, IncidentRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicIncidentSummary(incident: IncidentRecord) {
  return {
    id: incident.id,
    category: incident.category,
    title: incident.title,
    location: incident.location,
    occurredAt: incident.occurredAt.toISOString(),
    status: incident.status,
    reporterName: incident.reporterName,
    createdAt: incident.createdAt.toISOString(),
  };
}

function publicIncidentDetail(incident: IncidentRecord) {
  return {
    ...publicIncidentSummary(incident),
    description: incident.description,
    peopleInvolved: incident.peopleInvolved,
    actionTaken: incident.actionTaken,
  };
}

export async function registerIncidentRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("incident.create")];
  const readGuards = [authenticate, requirePermission("incident.read")];
  const manageGuards = [authenticate, requirePermission("incident.manage")];

  app.post("/api/v1/incidents", { preHandler: createGuards }, async (request, reply) => {
    const input = createIncidentInputSchema.parse(request.body);
    const incident = await repository.createIncident({
      auth: getAuthContext(request),
      incident: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply
      .status(201)
      .send({ data: { incident: publicIncidentDetail(incident) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/incidents", { preHandler: readGuards }, async (request) => {
    const query = incidentListQuerySchema.parse(request.query);
    const items = await repository.listIncidents({
      auth: getAuthContext(request),
      status: query.status,
      limit: query.limit,
    });
    return { data: { items: items.map(publicIncidentSummary) }, meta: responseMeta(request) };
  });

  app.get("/api/v1/incidents/:id", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const incident = await repository.getIncident(getAuthContext(request), id);
    if (!incident)
      throw new AppError(404, "INCIDENT_NOT_FOUND", "Laporan kejadian tidak ditemukan.");
    return { data: { incident: publicIncidentDetail(incident) }, meta: responseMeta(request) };
  });

  app.patch("/api/v1/incidents/:id", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const changes = updateIncidentInputSchema.parse(request.body);
    const result = await repository.updateIncident({
      auth: getAuthContext(request),
      incidentId: id,
      changes,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "NOT_FOUND") {
      throw new AppError(404, "INCIDENT_NOT_FOUND", "Laporan kejadian tidak ditemukan.");
    }
    return {
      data: { incident: publicIncidentDetail(result.incident) },
      meta: responseMeta(request),
    };
  });
}
