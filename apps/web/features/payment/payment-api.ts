import {
  paymentListResponseSchema,
  paymentMutationResponseSchema,
  type CreatePaymentInput,
  type PaymentListResponse,
  type PaymentMutationResponse,
  type PaymentStatus,
  type RejectPaymentInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const paymentKeys = {
  all: ["payments"] as const,
  queue: (status?: PaymentStatus) => ["payments", "queue", status ?? "all"] as const,
};

export function createPayment(input: CreatePaymentInput): Promise<PaymentMutationResponse> {
  return apiRequest("/payments", paymentMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listPayments(status?: PaymentStatus, limit = 20): Promise<PaymentListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest(`/payments?${query.toString()}`, paymentListResponseSchema);
}

export function verifyPayment(id: string): Promise<PaymentMutationResponse> {
  return apiRequest(`/payments/${encodeURIComponent(id)}/verify`, paymentMutationResponseSchema, {
    method: "POST",
  });
}

export function rejectPayment(
  id: string,
  input: RejectPaymentInput,
): Promise<PaymentMutationResponse> {
  return apiRequest(`/payments/${encodeURIComponent(id)}/reject`, paymentMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
