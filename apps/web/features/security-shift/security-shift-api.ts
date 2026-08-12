import {
  securityShiftMutationResponseSchema,
  securityShiftResponseSchema,
  type EndSecurityShiftInput,
  type SecurityShiftMutationResponse,
  type SecurityShiftResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const securityShiftKeys = {
  active: ["security-shift", "active"] as const,
};

export function getActiveShift(): Promise<SecurityShiftResponse> {
  return apiRequest("/security/shift", securityShiftResponseSchema);
}

export function startShift(): Promise<SecurityShiftMutationResponse> {
  return apiRequest("/security/shift/start", securityShiftMutationResponseSchema, {
    method: "POST",
  });
}

export function endShift(
  input: EndSecurityShiftInput = {},
): Promise<SecurityShiftMutationResponse> {
  return apiRequest("/security/shift/end", securityShiftMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
