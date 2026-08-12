import {
  onboardingOptionsResponseSchema,
  residencyRequestResponseSchema,
  type OnboardingOptionsResponse,
  type ResidencyRequestInput,
  type ResidencyRequestResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export function getOnboardingOptions(): Promise<OnboardingOptionsResponse> {
  return apiRequest("/onboarding/options", onboardingOptionsResponseSchema);
}

export function createResidencyRequest(
  input: ResidencyRequestInput,
): Promise<ResidencyRequestResponse> {
  return apiRequest("/onboarding/residency-requests", residencyRequestResponseSchema, {
    method: "POST",
    body: input,
  });
}
