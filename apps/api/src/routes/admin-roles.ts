import { setMemberRoleInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import { maskPhone } from "../lib/security";

const idParamsSchema = z.object({ id: z.string().uuid() });

export async function registerAdminRoleRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const guards = [authenticate, requirePermission("resident.manage")];

  app.get("/api/v1/admin/roles", { preHandler: guards }, async (request) => ({
    data: { roles: await repository.listRoles() },
    meta: responseMeta(request),
  }));

  app.get("/api/v1/admin/users", { preHandler: guards }, async (request) => {
    const members = await repository.listCommunityMembers(getAuthContext(request));
    return {
      data: {
        items: members.map((member) => ({
          residentId: member.residentId,
          userId: member.userId,
          displayName: member.displayName,
          phoneMasked: maskPhone(member.phoneE164),
          houseCode: member.houseCode,
          rtCode: member.rtCode,
          roles: member.roles,
        })),
      },
      meta: responseMeta(request),
    };
  });

  app.patch("/api/v1/admin/users/:id/role", { preHandler: guards }, async (request) => {
    const auth = getAuthContext(request);
    const { id } = idParamsSchema.parse(request.params);
    const input = setMemberRoleInputSchema.parse(request.body);
    const result = await repository.setMemberRole({
      auth,
      residentId: id,
      roleCode: input.roleCode,
      rtId: input.rtId,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome === "ROLE_NOT_FOUND") {
      throw new AppError(404, "ROLE_NOT_FOUND", "Peran tidak ditemukan.");
    }
    if (result.outcome === "CANNOT_CHANGE_SELF") {
      throw new AppError(
        409,
        "CANNOT_CHANGE_SELF",
        "Kamu tidak dapat mengubah peran akunmu sendiri.",
      );
    }
    if (result.outcome === "RT_REQUIRED") {
      throw new AppError(
        422,
        "RT_REQUIRED",
        "Pilih RT untuk peran Ketua RT sebelum menyimpan.",
      );
    }
    if (result.outcome === "RT_NOT_FOUND") {
      throw new AppError(404, "RT_NOT_FOUND", "RT tidak ditemukan di komunitas ini.");
    }
    if (result.outcome === "FORBIDDEN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Kamu tidak memiliki izin untuk memberikan peran ini.",
      );
    }
    if (result.outcome !== "OK") {
      throw new AppError(404, "MEMBER_NOT_FOUND", "Warga tidak ditemukan di komunitas ini.");
    }
    return {
      data: { residentId: result.residentId, roles: result.roles },
      meta: responseMeta(request),
    };
  });
}
