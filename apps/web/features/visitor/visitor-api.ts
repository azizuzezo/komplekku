import {
  visitorListResponseSchema,
  visitorLookupResponseSchema,
  visitorMutationResponseSchema,
  type CreateVisitorInput,
  type CreateWalkInVisitorInput,
  type VisitorListResponse,
  type VisitorLookupResponse,
  type VisitorMutationResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const visitorKeys = {
  all: ["visitor"] as const,
  list: (limit?: number) => ["visitor", "list", limit ?? 20] as const,
};

export function createVisitor(input: CreateVisitorInput): Promise<VisitorMutationResponse> {
  return apiRequest("/visitors", visitorMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function createWalkInVisitor(
  input: CreateWalkInVisitorInput,
): Promise<VisitorMutationResponse> {
  return apiRequest("/visitors/walk-in", visitorMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listVisitors(limit = 20): Promise<VisitorListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  return apiRequest(`/visitors?${query.toString()}`, visitorListResponseSchema);
}

export function lookupVisitorByQrToken(qrToken: string): Promise<VisitorLookupResponse> {
  return apiRequest(
    `/visitors/lookup/${encodeURIComponent(qrToken)}`,
    visitorLookupResponseSchema,
  );
}

export function checkInVisitor(qrToken: string): Promise<VisitorMutationResponse> {
  return apiRequest(
    `/visitors/check-in/${encodeURIComponent(qrToken)}`,
    visitorMutationResponseSchema,
    { method: "POST" },
  );
}

export function checkOutVisitor(id: string): Promise<VisitorMutationResponse> {
  return apiRequest(
    `/visitors/${encodeURIComponent(id)}/check-out`,
    visitorMutationResponseSchema,
    { method: "POST" },
  );
}
