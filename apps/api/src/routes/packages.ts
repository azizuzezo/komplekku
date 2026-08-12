import { collectPackageInputSchema, createPackageInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, PackageRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });

function publicPackage(pkg: PackageRecord) {
  return {
    id: pkg.id,
    recipientName: pkg.recipientName,
    courier: pkg.courier,
    trackingNumber: pkg.trackingNumber,
    status: pkg.status,
    houseCode: pkg.houseCode,
    householdDisplayName: pkg.householdDisplayName,
    receivedAt: pkg.receivedAt.toISOString(),
    collectedAt: pkg.collectedAt?.toISOString() ?? null,
    collectedByName: pkg.collectedByName,
  };
}

export async function registerPackageRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const readGuards = [authenticate, requirePermission("package.read")];
  const manageGuards = [authenticate, requirePermission("package.manage")];

  app.post("/api/v1/packages", { preHandler: manageGuards }, async (request, reply) => {
    const input = createPackageInputSchema.parse(request.body);
    const result = await repository.createPackage({
      auth: getAuthContext(request),
      package: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "HOUSE_NOT_FOUND") {
      throw new AppError(404, "HOUSE_NOT_FOUND", "Rumah tidak ditemukan.");
    }
    return reply
      .status(201)
      .send({ data: { package: publicPackage(result.package) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/packages", { preHandler: readGuards }, async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await repository.listPackages({
      auth: getAuthContext(request),
      limit: query.limit,
    });
    return { data: { items: items.map(publicPackage) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/packages/:id/collect", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = collectPackageInputSchema.parse(request.body);
    const result = await repository.collectPackage({
      auth: getAuthContext(request),
      packageId: id,
      collectedByName: input.collectedByName,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "PACKAGE_NOT_FOUND", "Paket tidak ditemukan.");
      }
      throw new AppError(409, "PACKAGE_ALREADY_COLLECTED", "Paket sudah diambil sebelumnya.");
    }
    return { data: { package: publicPackage(result.package) }, meta: responseMeta(request) };
  });
}
