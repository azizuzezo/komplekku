import {
  createEmergencyInputSchema,
  emergencyListResponseSchema,
  emergencyMutationResponseSchema,
  type CreateEmergencyInput,
  type EmergencyListResponse,
  type EmergencyMutationResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const emergencyKeys = {
  all: ["emergency"] as const,
  list: (limit: number) => ["emergency", "list", limit] as const,
};

export function createEmergency(input: CreateEmergencyInput): Promise<EmergencyMutationResponse> {
  const body = createEmergencyInputSchema.parse(input);
  return apiRequest("/emergencies", emergencyMutationResponseSchema, {
    method: "POST",
    body,
  });
}

export function listEmergencies(limit = 20): Promise<EmergencyListResponse> {
  return apiRequest(`/emergencies?limit=${limit}`, emergencyListResponseSchema);
}

export function acknowledgeEmergency(id: string): Promise<EmergencyMutationResponse> {
  return apiRequest(
    `/emergencies/${encodeURIComponent(id)}/acknowledge`,
    emergencyMutationResponseSchema,
    { method: "POST" },
  );
}

export function respondToEmergency(id: string): Promise<EmergencyMutationResponse> {
  return apiRequest(
    `/emergencies/${encodeURIComponent(id)}/respond`,
    emergencyMutationResponseSchema,
    { method: "POST" },
  );
}

export function resolveEmergency(id: string): Promise<EmergencyMutationResponse> {
  return apiRequest(
    `/emergencies/${encodeURIComponent(id)}/resolve`,
    emergencyMutationResponseSchema,
    { method: "POST" },
  );
}
