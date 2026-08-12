import {
  letterRequestListResponseSchema,
  letterRequestMutationResponseSchema,
  letterTypeListResponseSchema,
  type CreateLetterRequestInput,
  type LetterRequestListResponse,
  type LetterRequestMutationResponse,
  type LetterRequestStatus,
  type LetterTypeListResponse,
  type RejectLetterRequestInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const letterKeys = {
  all: ["letters"] as const,
  list: (status?: LetterRequestStatus) => ["letters", "list", status ?? "all"] as const,
  types: ["letters", "types"] as const,
};

export function listLetterTypes(): Promise<LetterTypeListResponse> {
  return apiRequest("/letter-types", letterTypeListResponseSchema);
}

export function createLetterRequest(
  input: CreateLetterRequestInput,
): Promise<LetterRequestMutationResponse> {
  return apiRequest("/letters", letterRequestMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listLetterRequests(
  status?: LetterRequestStatus,
  limit = 20,
): Promise<LetterRequestListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest(`/letters?${query.toString()}`, letterRequestListResponseSchema);
}

export function approveLetterRequest(id: string): Promise<LetterRequestMutationResponse> {
  return apiRequest(
    `/letters/${encodeURIComponent(id)}/approve`,
    letterRequestMutationResponseSchema,
    { method: "POST" },
  );
}

export function rejectLetterRequest(
  id: string,
  input: RejectLetterRequestInput,
): Promise<LetterRequestMutationResponse> {
  return apiRequest(
    `/letters/${encodeURIComponent(id)}/reject`,
    letterRequestMutationResponseSchema,
    { method: "POST", body: input },
  );
}

export function markLetterRequestReady(id: string): Promise<LetterRequestMutationResponse> {
  return apiRequest(
    `/letters/${encodeURIComponent(id)}/ready`,
    letterRequestMutationResponseSchema,
    { method: "POST" },
  );
}
