import type { FastifyRequest } from "fastify";

export function responseMeta(
  request: FastifyRequest,
  additional: Record<string, string | number> = {},
) {
  return {
    requestId: request.id,
    timestamp: new Date().toISOString(),
    ...additional,
  };
}

export function requestUserAgent(request: FastifyRequest): string | null {
  const value = request.headers["user-agent"];
  return typeof value === "string" ? value.slice(0, 500) : null;
}
