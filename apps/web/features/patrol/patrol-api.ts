import {
  patrolCheckpointListResponseSchema,
  patrolHistoryResponseSchema,
  patrolSessionMutationResponseSchema,
  patrolSessionResponseSchema,
  type PatrolCheckpointListResponse,
  type PatrolHistoryResponse,
  type PatrolSessionMutationResponse,
  type PatrolSessionResponse,
  type ScanCheckpointInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const patrolKeys = {
  checkpoints: ["patrol", "checkpoints"] as const,
  session: ["patrol", "session"] as const,
  history: ["patrol", "history"] as const,
};

export function listCheckpoints(): Promise<PatrolCheckpointListResponse> {
  return apiRequest("/patrol/checkpoints", patrolCheckpointListResponseSchema);
}

export function getActiveSession(): Promise<PatrolSessionResponse> {
  return apiRequest("/patrol/session", patrolSessionResponseSchema);
}

export function startSession(): Promise<PatrolSessionMutationResponse> {
  return apiRequest("/patrol/session/start", patrolSessionMutationResponseSchema, {
    method: "POST",
  });
}

export function scanCheckpoint(
  input: ScanCheckpointInput,
): Promise<PatrolSessionMutationResponse> {
  return apiRequest("/patrol/session/scan", patrolSessionMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function endSession(): Promise<PatrolSessionMutationResponse> {
  return apiRequest("/patrol/session/end", patrolSessionMutationResponseSchema, {
    method: "POST",
  });
}

export function listPatrolHistory(limit = 20): Promise<PatrolHistoryResponse> {
  return apiRequest(
    `/patrol/history?limit=${encodeURIComponent(String(limit))}`,
    patrolHistoryResponseSchema,
  );
}
