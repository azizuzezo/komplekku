import {
  cashTransactionListQuerySchema,
  createCashTransactionInputSchema,
} from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository, CashTransactionRecord } from "../domain/repository";
import { getAuthContext, requirePermission } from "../lib/authentication";
import { requestUserAgent, responseMeta } from "../lib/http";

function publicCashTransaction(transaction: CashTransactionRecord) {
  return {
    id: transaction.id,
    date: transaction.date,
    category: transaction.category,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    visibility: transaction.visibility,
    recordedByName: transaction.recordedByName,
    createdAt: transaction.createdAt.toISOString(),
  };
}

export async function registerCashRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const readGuards = [authenticate, requirePermission("cash.read")];
  const manageGuards = [authenticate, requirePermission("cash.manage")];

  app.get("/api/v1/cash-transactions", { preHandler: readGuards }, async (request) => {
    const query = cashTransactionListQuerySchema.parse(request.query);
    const ledger = await repository.listCashTransactions({
      auth: getAuthContext(request),
      period: query.period,
      limit: query.limit,
    });
    return {
      data: {
        items: ledger.items.map(publicCashTransaction),
        openingBalance: ledger.openingBalance,
        totalIncome: ledger.totalIncome,
        totalExpense: ledger.totalExpense,
        closingBalance: ledger.closingBalance,
      },
      meta: responseMeta(request),
    };
  });

  app.post("/api/v1/cash-transactions", { preHandler: manageGuards }, async (request, reply) => {
    const input = createCashTransactionInputSchema.parse(request.body);
    const transaction = await repository.createCashTransaction({
      auth: getAuthContext(request),
      transaction: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    return reply.status(201).send({
      data: { transaction: publicCashTransaction(transaction) },
      meta: responseMeta(request),
    });
  });
}
