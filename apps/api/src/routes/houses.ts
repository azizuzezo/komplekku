import { createHouseInputSchema, updateHouseInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, HouseRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicHouse(house: HouseRecord) {
  return {
    id: house.id,
    code: house.code,
    block: house.block,
    number: house.number,
    rtId: house.rtId,
    rtCode: house.rtCode,
    occupancyStatus: house.occupancyStatus,
    addressLabel: house.addressLabel,
    hasHousehold: house.hasHousehold,
    createdAt: house.createdAt.toISOString(),
  };
}

export async function registerHouseRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const manageGuards = [authenticate, requirePermission("resident.manage")];

  app.get("/api/v1/houses", { preHandler: manageGuards }, async (request) => {
    const items = await repository.listHouses(getAuthContext(request));
    return { data: { items: items.map(publicHouse) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/houses", { preHandler: manageGuards }, async (request, reply) => {
    const input = createHouseInputSchema.parse(request.body);
    const result = await repository.createHouse({
      auth: getAuthContext(request),
      house: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "RT_NOT_FOUND") {
      throw new AppError(404, "RT_NOT_FOUND", "RT tidak ditemukan di komunitas ini.");
    }
    if (result.outcome !== "OK") {
      throw new AppError(409, "HOUSE_CODE_CONFLICT", "Kode rumah ini sudah digunakan.");
    }
    return reply
      .status(201)
      .send({ data: { house: publicHouse(result.house) }, meta: responseMeta(request) });
  });

  app.patch("/api/v1/houses/:id", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = updateHouseInputSchema.parse(request.body);
    const result = await repository.updateHouse({
      auth: getAuthContext(request),
      houseId: id,
      changes: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "RT_NOT_FOUND") {
      throw new AppError(404, "RT_NOT_FOUND", "RT tidak ditemukan di komunitas ini.");
    }
    if (result.outcome !== "OK") {
      throw new AppError(404, "HOUSE_NOT_FOUND", "Rumah tidak ditemukan di komunitas ini.");
    }
    return { data: { house: publicHouse(result.house) }, meta: responseMeta(request) };
  });
}
