import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const roleSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
});

export type RoleSummary = z.infer<typeof roleSummarySchema>;

export const roleListResponseSchema = dataEnvelopeSchema(
  z.object({
    roles: z.array(roleSummarySchema),
  }),
);

export type RoleListResponse = z.infer<typeof roleListResponseSchema>;

export const communityMemberSchema = z.object({
  residentId: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  phoneMasked: z.string().min(1),
  houseCode: z.string().min(1).nullable(),
  rtCode: z.string().min(1).nullable(),
  roles: z.array(roleSummarySchema),
});

export type CommunityMember = z.infer<typeof communityMemberSchema>;

export const communityMemberListResponseSchema = dataEnvelopeSchema(
  z.object({
    items: z.array(communityMemberSchema),
  }),
);

export type CommunityMemberListResponse = z.infer<typeof communityMemberListResponseSchema>;

export const setMemberRoleInputSchema = z.object({
  roleCode: z.string().trim().min(1).max(64),
  rtId: z.string().uuid().optional(),
});

export type SetMemberRoleInput = z.infer<typeof setMemberRoleInputSchema>;

export const setMemberRoleResponseSchema = dataEnvelopeSchema(
  z.object({
    residentId: z.string().uuid(),
    roles: z.array(roleSummarySchema),
  }),
);

export type SetMemberRoleResponse = z.infer<typeof setMemberRoleResponseSchema>;
