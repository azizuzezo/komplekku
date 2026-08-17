import {
  rejectResidencyRequestInputSchema,
  residencyRequestInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type {
  AppRepository,
  ResidencyRequestRecord,
  ReviewResidencyRequestResult,
} from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import { maskPhone } from "../lib/security";

const idParamsSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function publicResidencyRequest(request: ResidencyRequestRecord) {
  return {
    id: request.id,
    status: request.status,
    fullName: request.fullName,
    relationship: request.relationship,
    submittedAt: request.submittedAt.toISOString(),
    community: request.community,
    house: request.house,
  };
}

function reviewError(result: ReviewResidencyRequestResult): never {
  if (result.outcome === "NOT_FOUND") {
    throw new AppError(404, "RESIDENCY_REQUEST_NOT_FOUND", "Permohonan warga tidak ditemukan.");
  }
  if (result.outcome === "NOT_PENDING") {
    throw new AppError(
      409,
      "RESIDENCY_REQUEST_NOT_PENDING",
      "Permohonan warga ini sudah ditinjau.",
    );
  }
  throw new AppError(
    409,
    "RESIDENCY_REQUEST_INCOMPLETE",
    "Data permohonan belum lengkap untuk diproses.",
  );
}

export async function registerOnboardingRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  app.get("/api/v1/onboarding/options", { preHandler: authenticate }, async (request) => ({
    data: { communities: await repository.listRegistrationCommunities() },
    meta: responseMeta(request),
  }));

  app.post(
    "/api/v1/onboarding/residency-requests",
    {
      preHandler: authenticate,
      config: { rateLimit: { max: 12, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const auth = getAuthContext(request);
      const input = residencyRequestInputSchema.parse(request.body);
      const result = await repository.createResidencyRequest({
        auth,
        communityId: input.communityId,
        rtId: input.rtId,
        houseCode: input.houseCode,
        fullName: input.fullName,
        relationship: input.relationship,
        now: new Date(),
        audit: {
          ipAddress: request.ip,
          userAgent: requestUserAgent(request),
        },
      });
      if (result.outcome === "COMMUNITY_NOT_FOUND") {
        throw new AppError(
          404,
          "RESIDENCY_TARGET_NOT_FOUND",
          "Komunitas atau kode rumah tidak tersedia untuk pendaftaran.",
        );
      }
      if (result.outcome === "HOUSE_NOT_FOUND") {
        throw new AppError(
          404,
          "RESIDENCY_TARGET_NOT_FOUND",
          "Komunitas atau kode rumah tidak tersedia untuk pendaftaran.",
        );
      }
      if (result.outcome === "PENDING_EXISTS") {
        throw new AppError(
          409,
          "RESIDENCY_REQUEST_EXISTS",
          "Permohonan untuk komunitas ini masih menunggu verifikasi.",
        );
      }
      if (result.outcome === "ALREADY_ACTIVE") {
        throw new AppError(409, "RESIDENCY_ALREADY_ACTIVE", "Akunmu sudah aktif di komunitas ini.");
      }
      if (result.outcome === "ACCOUNT_RESTRICTED") {
        throw new AppError(
          403,
          "RESIDENCY_REQUEST_NOT_ALLOWED",
          "Status akun belum mengizinkan permohonan baru.",
        );
      }
      if (result.outcome !== "CREATED") {
        throw new AppError(
          409,
          "RESIDENCY_REQUEST_NOT_ALLOWED",
          "Permohonan warga belum dapat dibuat.",
        );
      }

      return reply.status(201).send({
        data: { request: publicResidencyRequest(result.request) },
        meta: responseMeta(request),
      });
    },
  );

  app.get(
    "/api/v1/admin/residency-requests",
    { preHandler: [authenticate, requirePermission("resident.manage")] },
    async (request) => {
      const auth = getAuthContext(request);
      const query = listQuerySchema.parse(request.query);
      const result = await repository.listPendingResidencyRequests(auth, query.limit);
      return {
        data: {
          items: result.items.map((item) => ({
            ...publicResidencyRequest(item),
            user: { id: item.userId, phoneMasked: maskPhone(item.phoneE164) },
          })),
        },
        meta: responseMeta(request, { total: result.total }),
      };
    },
  );

  app.post(
    "/api/v1/admin/residency-requests/:id/approve",
    { preHandler: [authenticate, requirePermission("resident.manage")] },
    async (request) => {
      const auth = getAuthContext(request);
      const { id } = idParamsSchema.parse(request.params);
      const result = await repository.approveResidencyRequest({
        auth,
        requestId: id,
        now: new Date(),
        audit: {
          ipAddress: request.ip,
          userAgent: requestUserAgent(request),
        },
      });
      if (result.outcome !== "APPROVED") reviewError(result);
      return {
        data: {
          requestId: result.requestId,
          status: "ACTIVE" as const,
          reviewedAt: result.reviewedAt.toISOString(),
          householdId: result.householdId,
        },
        meta: responseMeta(request),
      };
    },
  );

  app.post(
    "/api/v1/admin/residency-requests/:id/reject",
    { preHandler: [authenticate, requirePermission("resident.manage")] },
    async (request) => {
      const auth = getAuthContext(request);
      const { id } = idParamsSchema.parse(request.params);
      const input = rejectResidencyRequestInputSchema.parse(request.body);
      const result = await repository.rejectResidencyRequest({
        auth,
        requestId: id,
        reason: input.reason,
        now: new Date(),
        audit: {
          ipAddress: request.ip,
          userAgent: requestUserAgent(request),
        },
      });
      if (result.outcome !== "REJECTED") reviewError(result);
      return {
        data: {
          requestId: result.requestId,
          status: "REJECTED" as const,
          reviewedAt: result.reviewedAt.toISOString(),
        },
        meta: responseMeta(request),
      };
    },
  );
}
