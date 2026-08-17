import {
  houseListResponseSchema,
  houseMutationResponseSchema,
  type CreateHouseInput,
  type HouseListResponse,
  type HouseMutationResponse,
  type UpdateHouseInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const houseKeys = {
  all: ["houses"] as const,
};

export function listHouses(): Promise<HouseListResponse> {
  return apiRequest("/houses", houseListResponseSchema);
}

export function createHouse(input: CreateHouseInput): Promise<HouseMutationResponse> {
  return apiRequest("/houses", houseMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function updateHouse(input: {
  houseId: string;
  changes: UpdateHouseInput;
}): Promise<HouseMutationResponse> {
  return apiRequest(`/houses/${input.houseId}`, houseMutationResponseSchema, {
    method: "PATCH",
    body: input.changes,
  });
}
