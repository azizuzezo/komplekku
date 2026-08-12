import type { FastifyInstance } from "fastify";

import type { AppRepository } from "../domain/repository";
import { responseMeta } from "../lib/http";

export async function registerHealthRoutes(app: FastifyInstance, repository: AppRepository) {
  app.get("/health/live", async (request) => ({
    data: { status: "up" },
    meta: responseMeta(request),
  }));

  app.get("/health/ready", async (request, reply) => {
    try {
      await repository.healthCheck();
      return {
        data: { status: "ready" },
        meta: responseMeta(request),
      };
    } catch {
      return reply.status(503).send({
        error: {
          code: "NOT_READY",
          message: "Layanan belum siap menerima permintaan.",
        },
      });
    }
  });
}
