import {
  addHouseholdMemberResponseSchema,
  currentHouseholdResponseSchema,
  removeHouseholdMemberResponseSchema,
  type AddHouseholdMemberInput,
  type AddHouseholdMemberResponse,
  type CurrentHouseholdResponse,
  type RemoveHouseholdMemberResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export function getCurrentHousehold(): Promise<CurrentHouseholdResponse> {
  return apiRequest("/household/current", currentHouseholdResponseSchema);
}

export function addHouseholdMember(
  input: AddHouseholdMemberInput,
): Promise<AddHouseholdMemberResponse> {
  return apiRequest("/household/members", addHouseholdMemberResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function removeHouseholdMember(
  residentId: string,
): Promise<RemoveHouseholdMemberResponse> {
  return apiRequest(`/household/members/${residentId}`, removeHouseholdMemberResponseSchema, {
    method: "DELETE",
  });
}
