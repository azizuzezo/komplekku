import {
  incidentDetailResponseSchema,
  incidentListResponseSchema,
  incidentMutationResponseSchema,
  type CreateIncidentInput,
  type IncidentDetailResponse,
  type IncidentListResponse,
  type IncidentMutationResponse,
  type IncidentStatus,
  type UpdateIncidentInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const incidentKeys = {
  all: ["incidents"] as const,
  list: (status?: IncidentStatus) => ["incidents", "list", status ?? "all"] as const,
  detail: (id: string) => ["incidents", "detail", id] as const,
};

export function listIncidents(status?: IncidentStatus, limit = 20): Promise<IncidentListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest(`/incidents?${query.toString()}`, incidentListResponseSchema);
}

export function getIncident(id: string): Promise<IncidentDetailResponse> {
  return apiRequest(`/incidents/${encodeURIComponent(id)}`, incidentDetailResponseSchema);
}

export function createIncident(input: CreateIncidentInput): Promise<IncidentMutationResponse> {
  return apiRequest("/incidents", incidentMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function updateIncident(
  id: string,
  input: UpdateIncidentInput,
): Promise<IncidentMutationResponse> {
  return apiRequest(`/incidents/${encodeURIComponent(id)}`, incidentMutationResponseSchema, {
    method: "PATCH",
    body: input,
  });
}
