import { addHouseholdMemberInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, CurrentHouseholdMemberRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import { maskPhone, normalizeIndonesianPhone } from "../lib/security";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicMember(member: CurrentHouseholdMemberRecord) {
  return {
    residentId: member.residentId,
    userId: member.userId,
    displayName: member.displayName,
    relationship: member.relationship,
    linkedAccount: member.linkedAccount,
    phoneMasked: member.phoneE164 ? maskPhone(member.phoneE164) : null,
  };
}

export async function registerHouseholdRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  app.get(
    "/api/v1/household/current",
    { preHandler: [authenticate, requirePermission("household.read")] },
    async (request) => {
      const household = await repository.getCurrentHousehold(getAuthContext(request));
      if (!household) {
        throw new AppError(
          409,
          "HOUSEHOLD_CONTEXT_REQUIRED",
          "Pilih rumah tangga terlebih dahulu.",
        );
      }
      return {
        data: {
          household: {
            id: household.id,
            displayName: household.displayName,
            occupancyStatus: household.occupancyStatus,
            house: household.house,
            members: household.members.map(publicMember),
          },
        },
        meta: responseMeta(request),
      };
    },
  );

  app.post(
    "/api/v1/household/members",
    { preHandler: [authenticate, requirePermission("household.manage")] },
    async (request, reply) => {
      const auth = getAuthContext(request);
      const input = addHouseholdMemberInputSchema.parse(request.body);
      const phoneE164 = normalizeIndonesianPhone(input.phone);
      const result = await repository.addHouseholdMember({
        auth,
        fullName: input.fullName,
        phoneE164,
        relationship: input.relationship,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome === "ALREADY_MEMBER") {
        throw new AppError(
          409,
          "HOUSEHOLD_MEMBER_EXISTS",
          "Nomor ini sudah menjadi anggota rumah tangga ini.",
        );
      }
      if (result.outcome === "ALREADY_RESIDENT_ELSEWHERE") {
        throw new AppError(
          409,
          "HOUSEHOLD_MEMBER_ELSEWHERE",
          "Nomor ini sudah aktif di rumah tangga lain dalam komunitas ini.",
        );
      }
      if (result.outcome !== "OK") {
        throw new AppError(
          409,
          "HOUSEHOLD_CONTEXT_REQUIRED",
          "Pilih rumah tangga terlebih dahulu.",
        );
      }
      return reply.status(201).send({
        data: { member: publicMember(result.member) },
        meta: responseMeta(request),
      });
    },
  );

  app.delete(
    "/api/v1/household/members/:id",
    { preHandler: [authenticate, requirePermission("household.manage")] },
    async (request) => {
      const auth = getAuthContext(request);
      const { id } = idParamsSchema.parse(request.params);
      const result = await repository.removeHouseholdMember({
        auth,
        residentId: id,
        now: new Date(),
        audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
      });
      if (result.outcome === "CANNOT_REMOVE_PRIMARY") {
        throw new AppError(
          409,
          "HOUSEHOLD_MEMBER_IS_SELF",
          "Kamu tidak dapat menghapus dirimu sendiri dari rumah tangga.",
        );
      }
      if (result.outcome !== "REMOVED") {
        throw new AppError(
          404,
          "HOUSEHOLD_MEMBER_NOT_FOUND",
          "Anggota rumah tangga tidak ditemukan.",
        );
      }
      return {
        data: { residentId: result.residentId, removed: true as const },
        meta: responseMeta(request),
      };
    },
  );
}
