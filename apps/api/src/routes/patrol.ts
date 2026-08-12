import { scanCheckpointInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, PatrolSessionRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });

function publicSession(session: PatrolSessionRecord) {
  return {
    id: session.id,
    officerName: session.officerName,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    totalCheckpoints: session.totalCheckpoints,
    scans: session.scans.map((scan) => ({
      checkpointId: scan.checkpointId,
      checkpointName: scan.checkpointName,
      scannedAt: scan.scannedAt.toISOString(),
      note: scan.note,
    })),
  };
}

export async function registerPatrolRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const executeGuards = [authenticate, requirePermission("patrol.execute")];
  const manageGuards = [authenticate, requirePermission("patrol.manage")];

  app.get("/api/v1/patrol/checkpoints", { preHandler: executeGuards }, async (request) => {
    const items = await repository.listPatrolCheckpoints(getAuthContext(request));
    return { data: { items }, meta: responseMeta(request) };
  });

  app.get("/api/v1/patrol/session", { preHandler: executeGuards }, async (request) => {
    const session = await repository.getActivePatrolSession(getAuthContext(request));
    return { data: { session: session ? publicSession(session) : null }, meta: responseMeta(request) };
  });

  app.post("/api/v1/patrol/session/start", { preHandler: executeGuards }, async (request) => {
    const session = await repository.startPatrolSession({
      auth: getAuthContext(request),
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return { data: { session: publicSession(session) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/patrol/session/scan", { preHandler: executeGuards }, async (request) => {
    const input = scanCheckpointInputSchema.parse(request.body);
    const result = await repository.scanPatrolCheckpoint({
      auth: getAuthContext(request),
      qrToken: input.qrToken,
      note: input.note,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NO_ACTIVE_SESSION") {
        throw new AppError(409, "PATROL_NO_ACTIVE_SESSION", "Mulai patroli sebelum memindai checkpoint.");
      }
      if (result.outcome === "CHECKPOINT_NOT_FOUND") {
        throw new AppError(404, "CHECKPOINT_NOT_FOUND", "Checkpoint tidak ditemukan.");
      }
      throw new AppError(409, "CHECKPOINT_ALREADY_SCANNED", "Checkpoint ini sudah dipindai.");
    }
    return { data: { session: publicSession(result.session) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/patrol/session/end", { preHandler: executeGuards }, async (request) => {
    const session = await repository.endPatrolSession({
      auth: getAuthContext(request),
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return { data: { session: session ? publicSession(session) : null }, meta: responseMeta(request) };
  });

  app.get("/api/v1/patrol/history", { preHandler: manageGuards }, async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await repository.listPatrolHistory(getAuthContext(request), query.limit);
    return { data: { items: items.map(publicSession) }, meta: responseMeta(request) };
  });
}
