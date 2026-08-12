import { createCameraInputSchema, updateCameraInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository } from "../domain/repository";
import { getAuthContext, requireAnyPermission, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

export async function registerCameraRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const readGuards = [
    authenticate,
    requireAnyPermission("camera.public.read", "camera.security.read", "camera.manage"),
  ];
  const manageGuards = [authenticate, requirePermission("camera.manage")];

  app.get("/api/v1/cameras", { preHandler: readGuards }, async (request) => {
    const items = await repository.listCameras(getAuthContext(request));
    return {
      data: {
        items: items.map((camera) => ({
          id: camera.id,
          name: camera.name,
          location: camera.location,
          accessLevel: camera.accessLevel,
          status: camera.status,
          lastOnlineAt: camera.lastOnlineAt?.toISOString() ?? null,
        })),
      },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/cameras", { preHandler: manageGuards }, async (request, reply) => {
    const camera = createCameraInputSchema.parse(request.body);
    const created = await repository.createCamera({
      auth: getAuthContext(request),
      camera,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply.status(201).send({
      data: {
        camera: {
          id: created.id,
          name: created.name,
          location: created.location,
          accessLevel: created.accessLevel,
          status: created.status,
          lastOnlineAt: created.lastOnlineAt?.toISOString() ?? null,
        },
      },
      meta: responseMeta(request),
    });
  });

  app.patch("/api/v1/cameras/:id", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const changes = updateCameraInputSchema.parse(request.body);
    const result = await repository.updateCamera({
      auth: getAuthContext(request),
      cameraId: id,
      changes,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "NOT_FOUND") {
      throw new AppError(404, "CAMERA_NOT_FOUND", "Kamera tidak ditemukan.");
    }
    return {
      data: {
        camera: {
          id: result.camera.id,
          name: result.camera.name,
          location: result.camera.location,
          accessLevel: result.camera.accessLevel,
          status: result.camera.status,
          lastOnlineAt: result.camera.lastOnlineAt?.toISOString() ?? null,
        },
      },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/cameras/:id/stream-ticket", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.issueStreamTicket({
      auth: getAuthContext(request),
      cameraId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "CAMERA_NOT_FOUND", "Kamera tidak ditemukan.");
      }
      throw new AppError(403, "CAMERA_ACCESS_DENIED", "Kamu tidak memiliki izin untuk kamera ini.");
    }
    return {
      data: {
        cameraId: result.cameraId,
        mode: result.mode,
        status: result.status,
        ticket: result.ticket,
        expiresAt: result.expiresAt?.toISOString() ?? null,
        watermark: {
          label: "KOMPLEKKU",
          viewerName: result.viewerName,
          generatedAt: new Date().toISOString(),
        },
      },
      meta: responseMeta(request),
    };
  });
}
