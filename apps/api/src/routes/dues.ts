import {
  createDuesTypeInputSchema,
  generateInvoicesInputSchema,
  invoiceListQuerySchema,
  waiveInvoiceInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, InvoiceRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicInvoice(invoice: InvoiceRecord) {
  return {
    id: invoice.id,
    duesTypeId: invoice.duesTypeId,
    duesTypeName: invoice.duesTypeName,
    period: invoice.period,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    status: invoice.status,
    houseCode: invoice.houseCode,
    householdDisplayName: invoice.householdDisplayName,
    waivedReason: invoice.waivedReason,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    receiptNumber: invoice.receiptNumber,
    createdAt: invoice.createdAt.toISOString(),
  };
}

export async function registerDuesRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const manageGuards = [authenticate, requirePermission("dues.manage")];
  const readGuards = [authenticate, requirePermission("invoice.read")];

  app.get("/api/v1/dues-types", { preHandler: manageGuards }, async (request) => {
    const items = await repository.listDuesTypes(getAuthContext(request));
    return { data: { items }, meta: responseMeta(request) };
  });

  app.post("/api/v1/dues-types", { preHandler: manageGuards }, async (request, reply) => {
    const input = createDuesTypeInputSchema.parse(request.body);
    const duesType = await repository.createDuesType({
      auth: getAuthContext(request),
      duesType: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply.status(201).send({ data: { duesType }, meta: responseMeta(request) });
  });

  app.post("/api/v1/invoices/generate", { preHandler: manageGuards }, async (request, reply) => {
    const input = generateInvoicesInputSchema.parse(request.body);
    const createdCount = await repository.generateInvoices({
      auth: getAuthContext(request),
      generate: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply.status(201).send({ data: { createdCount }, meta: responseMeta(request) });
  });

  app.get("/api/v1/invoices", { preHandler: readGuards }, async (request) => {
    const query = invoiceListQuerySchema.parse(request.query);
    const items = await repository.listInvoices({
      auth: getAuthContext(request),
      status: query.status,
      limit: query.limit,
    });
    return { data: { items: items.map(publicInvoice) }, meta: responseMeta(request) };
  });

  app.get("/api/v1/invoices/:id", { preHandler: readGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const invoice = await repository.getInvoice(getAuthContext(request), id);
    if (!invoice) throw new AppError(404, "INVOICE_NOT_FOUND", "Tagihan tidak ditemukan.");
    return { data: { invoice: publicInvoice(invoice) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/invoices/:id/waive", { preHandler: manageGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = waiveInvoiceInputSchema.parse(request.body);
    const result = await repository.waiveInvoice({
      auth: getAuthContext(request),
      invoiceId: id,
      reason: input.reason,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "INVOICE_NOT_FOUND", "Tagihan tidak ditemukan.");
      }
      throw new AppError(409, "INVOICE_INVALID_TRANSITION", "Tagihan ini sudah lunas atau sudah dibebaskan.");
    }
    return { data: { invoice: publicInvoice(result.invoice) }, meta: responseMeta(request) };
  });
}
