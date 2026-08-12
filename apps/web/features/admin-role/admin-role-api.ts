import {
  communityMemberListResponseSchema,
  roleListResponseSchema,
  setMemberRoleResponseSchema,
  type CommunityMemberListResponse,
  type RoleListResponse,
  type SetMemberRoleResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const adminRoleKeys = {
  roles: ["admin-roles"] as const,
  members: ["admin-community-members"] as const,
};

export function listRoles(): Promise<RoleListResponse> {
  return apiRequest("/admin/roles", roleListResponseSchema);
}

export function listCommunityMembers(): Promise<CommunityMemberListResponse> {
  return apiRequest("/admin/users", communityMemberListResponseSchema);
}

export function setMemberRole(input: {
  residentId: string;
  roleCode: string;
}): Promise<SetMemberRoleResponse> {
  return apiRequest(`/admin/users/${input.residentId}/role`, setMemberRoleResponseSchema, {
    method: "PATCH",
    body: { roleCode: input.roleCode },
  });
}
