import {
  createPaymentInputSchema,
  paymentListQuerySchema,
  rejectPaymentInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, PaymentRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicPayment(payment: PaymentRecord) {
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    duesTypeName: payment.duesTypeName,
    period: payment.period,
    amount: payment.amount,
    paidAt: payment.paidAt,
    note: payment.note,
    status: payment.status,
    submittedByName: payment.submittedByName,
    houseCode: payment.houseCode,
    householdDisplayName: payment.householdDisplayName,
    verifiedByName: payment.verifiedByName,
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    rejectionReason: payment.rejectionReason,
    receiptNumber: payment.receiptNumber,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function registerPaymentRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const createGuards = [authenticate, requirePermission("payment.create")];
  const verifyGuards = [authenticate, requirePermission("payment.verify")];

  app.post("/api/v1/payments", { preHandler: createGuards }, async (request, reply) => {
    const input = createPaymentInputSchema.parse(request.body);
    const result = await repository.createPayment({
      auth: getAuthContext(request),
      payment: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "INVOICE_NOT_FOUND") {
        throw new AppError(404, "INVOICE_NOT_FOUND", "Tagihan tidak ditemukan.");
      }
      throw new AppError(
        409,
        "INVOICE_INVALID_STATE",
        "Tagihan ini sedang diverifikasi, sudah lunas, atau sudah dibebaskan.",
      );
    }
    return reply
      .status(201)
      .send({ data: { payment: publicPayment(result.payment) }, meta: responseMeta(request) });
  });

  app.get("/api/v1/payments", { preHandler: verifyGuards }, async (request) => {
    const query = paymentListQuerySchema.parse(request.query);
    const items = await repository.listPayments({
      auth: getAuthContext(request),
      status: query.status,
      limit: query.limit,
    });
    return { data: { items: items.map(publicPayment) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/payments/:id/verify", { preHandler: verifyGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.verifyPayment({
      auth: getAuthContext(request),
      paymentId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Pembayaran tidak ditemukan.");
      }
      throw new AppError(
        409,
        "PAYMENT_INVALID_TRANSITION",
        "Pembayaran ini sudah diproses sebelumnya.",
      );
    }
    return { data: { payment: publicPayment(result.payment) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/payments/:id/reject", { preHandler: verifyGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = rejectPaymentInputSchema.parse(request.body);
    const result = await repository.rejectPayment({
      auth: getAuthContext(request),
      paymentId: id,
      reason: input.reason,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Pembayaran tidak ditemukan.");
      }
      throw new AppError(
        409,
        "PAYMENT_INVALID_TRANSITION",
        "Pembayaran ini sudah diproses sebelumnya.",
      );
    }
    return { data: { payment: publicPayment(result.payment) }, meta: responseMeta(request) };
  });
}
