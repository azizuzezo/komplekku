import {
  cashTransactionListResponseSchema,
  cashTransactionMutationResponseSchema,
  type CashTransactionListResponse,
  type CashTransactionMutationResponse,
  type CreateCashTransactionInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const cashKeys = {
  all: ["cash"] as const,
  ledger: (period?: string) => ["cash", "ledger", period ?? "all"] as const,
};

export function cashTransactionListPath(period?: string, limit = 50) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (period) query.set("period", period);
  return `/cash-transactions?${query.toString()}`;
}

export function listCashTransactions(
  period?: string,
  limit = 50,
): Promise<CashTransactionListResponse> {
  return apiRequest(cashTransactionListPath(period, limit), cashTransactionListResponseSchema);
}

export function createCashTransaction(
  input: CreateCashTransactionInput,
): Promise<CashTransactionMutationResponse> {
  return apiRequest("/cash-transactions", cashTransactionMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
