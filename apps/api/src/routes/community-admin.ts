import {
  createCommunityInputSchema,
  createRtInputSchema,
  updateCommunityInputSchema,
  updateRtInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

export async function registerCommunityAdminRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const manageCommunityGuards = [authenticate, requirePermission("community.manage")];
  const platformGuards = [authenticate, requirePermission("platform.community.create")];
  const readRtGuards = [authenticate, requirePermission("community.read")];

  app.patch("/api/v1/admin/community", { preHandler: manageCommunityGuards }, async (request) => {
    const auth = getAuthContext(request);
    const input = updateCommunityInputSchema.parse(request.body);
    const result = await repository.updateCommunity({
      auth,
      changes: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "COMMUNITY_CONTEXT_REQUIRED", "Pilih komunitas terlebih dahulu.");
    }
    return { data: { community: result.community }, meta: responseMeta(request) };
  });

  app.get("/api/v1/admin/communities", { preHandler: platformGuards }, async (request) => ({
    data: { items: await repository.listCommunitiesForPlatformAdmin(getAuthContext(request)) },
    meta: responseMeta(request),
  }));

  app.post("/api/v1/admin/communities", { preHandler: platformGuards }, async (request, reply) => {
    const auth = getAuthContext(request);
    const input = createCommunityInputSchema.parse(request.body);
    const result = await repository.createCommunity({
      auth,
      community: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "COMMUNITY_SLUG_CONFLICT", "Slug komunitas ini sudah digunakan.");
    }
    return reply
      .status(201)
      .send({ data: { community: result.community }, meta: responseMeta(request) });
  });

  app.get("/api/v1/admin/rts", { preHandler: readRtGuards }, async (request) => ({
    data: { items: await repository.listRts(getAuthContext(request)) },
    meta: responseMeta(request),
  }));

  app.post("/api/v1/admin/rts", { preHandler: manageCommunityGuards }, async (request, reply) => {
    const auth = getAuthContext(request);
    const input = createRtInputSchema.parse(request.body);
    const result = await repository.createRt({
      auth,
      rt: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      throw new AppError(409, "RT_CODE_CONFLICT", "Kode RT ini sudah digunakan.");
    }
    return reply.status(201).send({ data: { rt: result.rt }, meta: responseMeta(request) });
  });

  app.patch("/api/v1/admin/rts/:id", { preHandler: manageCommunityGuards }, async (request) => {
    const auth = getAuthContext(request);
    const { id } = idParamsSchema.parse(request.params);
    const input = updateRtInputSchema.parse(request.body);
    const result = await repository.updateRt({
      auth,
      rtId: id,
      changes: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "CODE_CONFLICT") {
      throw new AppError(409, "RT_CODE_CONFLICT", "Kode RT ini sudah digunakan.");
    }
    if (result.outcome !== "OK") {
      throw new AppError(404, "RT_NOT_FOUND", "RT tidak ditemukan di komunitas ini.");
    }
    return { data: { rt: result.rt }, meta: responseMeta(request) };
  });
}
