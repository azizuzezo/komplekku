import {
  communityListResponseSchema,
  communityMutationResponseSchema,
  currentCommunityResponseSchema,
  rtListResponseSchema,
  rtMutationResponseSchema,
  type CommunityListResponse,
  type CommunityMutationResponse,
  type CreateCommunityInput,
  type CreateRtInput,
  type CurrentCommunityResponse,
  type RtListResponse,
  type RtMutationResponse,
  type UpdateCommunityInput,
  type UpdateRtInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const communityAdminKeys = {
  current: ["community-current"] as const,
  rts: ["community-rts"] as const,
  platformCommunities: ["platform-communities"] as const,
};

export function getCurrentCommunity(): Promise<CurrentCommunityResponse> {
  return apiRequest("/communities/current", currentCommunityResponseSchema);
}

export function updateCommunity(input: UpdateCommunityInput): Promise<CommunityMutationResponse> {
  return apiRequest("/admin/community", communityMutationResponseSchema, {
    method: "PATCH",
    body: input,
  });
}

export function listRts(): Promise<RtListResponse> {
  return apiRequest("/admin/rts", rtListResponseSchema);
}

export function createRt(input: CreateRtInput): Promise<RtMutationResponse> {
  return apiRequest("/admin/rts", rtMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function updateRt(input: {
  rtId: string;
  changes: UpdateRtInput;
}): Promise<RtMutationResponse> {
  return apiRequest(`/admin/rts/${input.rtId}`, rtMutationResponseSchema, {
    method: "PATCH",
    body: input.changes,
  });
}

export function listPlatformCommunities(): Promise<CommunityListResponse> {
  return apiRequest("/admin/communities", communityListResponseSchema);
}

export function createPlatformCommunity(
  input: CreateCommunityInput,
): Promise<CommunityMutationResponse> {
  return apiRequest("/admin/communities", communityMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
