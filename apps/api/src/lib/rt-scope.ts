/**
 * Computes the RT scoping for an authenticated session from its role
 * assignments in the current community.
 *
 * `null` means unrestricted within the community — SUPER_ADMIN and
 * COMMUNITY_ADMIN (Ketua RW) always see every RT. A non-null value means the
 * actor is an RT_ADMIN (Ketua RT) whose admin actions (member/house
 * listing, residency approvals, RT-scoped moderation) must be confined to
 * that one RT. Shared by both prisma-repository.ts and memory-repository.ts
 * so the scoping rule can't drift between the real and in-memory backends.
 */
export function computeRtScopeId(
  userRoles: Array<{ roleCode: string; rtId: string | null }>,
): string | null {
  const hasUnscopedAdmin = userRoles.some(
    (userRole) => userRole.roleCode === "SUPER_ADMIN" || userRole.roleCode === "COMMUNITY_ADMIN",
  );
  if (hasUnscopedAdmin) return null;

  const rtAdminRole = userRoles.find(
    (userRole) => userRole.roleCode === "RT_ADMIN" && userRole.rtId,
  );
  return rtAdminRole?.rtId ?? null;
}
