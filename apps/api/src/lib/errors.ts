import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function isFastifyClientError(error: unknown): error is { statusCode: number; code?: string } {
  if (typeof error !== "object" || error === null) return false;
  const statusCode = Reflect.get(error, "statusCode");
  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 500;
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Data yang dikirim belum valid.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      });
    }

    if (isFastifyClientError(error)) {
      const message =
        error.statusCode === 415
          ? "Format data permintaan tidak didukung."
          : error.statusCode === 404
            ? "Endpoint yang diminta tidak ditemukan."
            : "Permintaan tidak dapat diproses.";
      return reply.status(error.statusCode).send({
        error: {
          code:
            typeof error.code === "string" && error.code.startsWith("FST_ERR_")
              ? error.code
              : "BAD_REQUEST",
          message,
        },
      });
    }

    request.log.error({ err: error }, "Permintaan API gagal");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Layanan sedang mengalami kendala. Silakan coba lagi.",
      },
    });
  });
}
