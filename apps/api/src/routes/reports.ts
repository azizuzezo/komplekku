import {
  addReportUpdateInputSchema,
  createReportInputSchema,
  reportListQuerySchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, ReportRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicReportSummary(report: ReportRecord) {
  return {
    id: report.id,
    category: report.category,
    description: report.description,
    location: report.location,
    status: report.status,
    photos: report.photos,
    reporterName: report.reporterName,
    houseCode: report.houseCode,
    householdDisplayName: report.householdDisplayName,
    createdAt: report.createdAt.toISOString(),
  };
}

function publicReportDetail(report: ReportRecord) {
  return {
    ...publicReportSummary(report),
    updates: report.updates.map((update) => ({
      id: update.id,
      status: update.status,
      note: update.note,
      actorName: update.actorName,
      createdAt: update.createdAt.toISOString(),
    })),
  };
}

export async function registerReportRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("report.create")];
  const readGuards = [authenticate, requirePermission("report.read")];
  const manageGuards = [authenticate, requirePermission("report.manage")];

  app.post("/api/v1/reports", { preHandler: createGuards }, async (request, reply) => {
    const input = createReportInputSchema.parse(request.body);
    const result = await repository.createReport({
      auth: getAuthContext(request),
      report: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "HOUSEHOLD_CONTEXT_REQUIRED", "Rumah tangga aktif diperlukan.");
    }
    return reply
      .status(201)
      .send({ data: { report: publicReportDetail(result.report) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/reports", { preHandler: readGuards }, async (request) => {
    const query = reportListQuerySchema.parse(request.query);
    const items = await repository.listReports({
      auth: getAuthContext(request),
      status: query.status,
      limit: query.limit,
    });
    return { data: { items: items.map(publicReportSummary) }, meta: responseMeta(request) };
  });

  app.get("/api/v1/reports/:id", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const report = await repository.getReport(getAuthContext(request), id);
    if (!report) throw new AppError(404, "REPORT_NOT_FOUND", "Laporan tidak ditemukan.");
    return { data: { report: publicReportDetail(report) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/reports/:id/updates", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = addReportUpdateInputSchema.parse(request.body);
    const result = await repository.addReportUpdate({
      auth: getAuthContext(request),
      reportId: id,
      update: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(404, "REPORT_NOT_FOUND", "Laporan tidak ditemukan.");
    }
    return { data: { report: publicReportDetail(result.report) }, meta: responseMeta(request) };
  });
}
