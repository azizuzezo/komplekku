import type { FastifyRequest, preHandlerHookHandler } from "fastify";

import type { AppRepository, AuthSessionRecord } from "../domain/repository";
import type { AppConfig } from "./env";
import { AppError } from "./errors";
import { sessionTokenDigest } from "./security";

type AuthenticatedRequest = FastifyRequest & { authContext?: AuthSessionRecord };

function tokenFromRequest(request: FastifyRequest, cookieName: string): string | null {
  const authorization = request.headers.authorization;
  if (authorization !== undefined) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match?.[1]) return null;
    return match[1];
  }
  return request.cookies[cookieName] ?? null;
}

export function createAuthenticate(
  repository: AppRepository,
  config: AppConfig,
): preHandlerHookHandler {
  return async (request) => {
    const token = tokenFromRequest(request, config.SESSION_COOKIE_NAME);
    if (!token) {
      throw new AppError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
    }
    const auth = await repository.findAuthSession(sessionTokenDigest(token), new Date());
    if (!auth) {
      throw new AppError(401, "SESSION_INVALID", "Sesi sudah berakhir. Silakan masuk kembali.");
    }
    (request as AuthenticatedRequest).authContext = auth;
  };
}

export function requirePermission(permission: string): preHandlerHookHandler {
  return async (request) => {
    const auth = getAuthContext(request);
    if (!auth.permissions.includes(permission)) {
      throw new AppError(403, "FORBIDDEN", "Kamu tidak memiliki izin untuk membuka data ini.");
    }
  };
}

export function requireAnyPermission(...permissions: string[]): preHandlerHookHandler {
  return async (request) => {
    const auth = getAuthContext(request);
    if (!permissions.some((permission) => auth.permissions.includes(permission))) {
      throw new AppError(403, "FORBIDDEN", "Kamu tidak memiliki izin untuk membuka data ini.");
    }
  };
}

export function getAuthContext(request: FastifyRequest): AuthSessionRecord {
  const auth = (request as AuthenticatedRequest).authContext;
  if (!auth) {
    throw new AppError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  }
  return auth;
}
