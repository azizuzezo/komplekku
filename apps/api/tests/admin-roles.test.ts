import {
  communityMemberListResponseSchema,
  roleListResponseSchema,
  setMemberRoleResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

const adminPermissions = [
  "announcement.read",
  "community.read",
  "home.read",
  "household.read",
  "resident.manage",
];

describe("peran anggota komunitas (super admin panel)", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("menampilkan daftar peran dan warga, lalu mengubah peran seseorang", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const admin = await loginWeb(app);
    repository.setPermissions(demoIds.user, adminPermissions);

    const roles = await app.inject({
      method: "GET",
      url: "/api/v1/admin/roles",
      headers: { cookie: admin.cookie },
    });
    expect(roles.statusCode).toBe(200);
    expect(roleListResponseSchema.safeParse(roles.json()).success).toBe(true);
    const roleCodes = roles.json().data.roles.map((role: { code: string }) => role.code);
    expect(roleCodes).toEqual(
      expect.arrayContaining(["SUPER_ADMIN", "RT_ADMIN", "SEKRETARIS", "SECURITY"]),
    );
    const rtAdmin = roles
      .json()
      .data.roles.find((role: { code: string }) => role.code === "RT_ADMIN");
    expect(rtAdmin.name).toBe("Ketua RT");

    const membersBefore = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: { cookie: admin.cookie },
    });
    expect(membersBefore.statusCode).toBe(200);
    expect(communityMemberListResponseSchema.safeParse(membersBefore.json()).success).toBe(true);
    const security = membersBefore
      .json()
      .data.items.find(
        (item: { residentId: string }) => item.residentId === demoIds.securityResident,
      );
    expect(security.roles[0].code).toBe("SECURITY");

    const changed = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: admin.cookie },
      payload: { roleCode: "SEKRETARIS" },
    });
    expect(changed.statusCode).toBe(200);
    expect(setMemberRoleResponseSchema.safeParse(changed.json()).success).toBe(true);
    expect(changed.json().data.roles[0].code).toBe("SEKRETARIS");

    const membersAfter = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: { cookie: admin.cookie },
    });
    const updatedSecurity = membersAfter
      .json()
      .data.items.find(
        (item: { residentId: string }) => item.residentId === demoIds.securityResident,
      );
    expect(updatedSecurity.roles[0].code).toBe("SEKRETARIS");
    expect(updatedSecurity.roles[0].name).toBe("Sekretaris");

    const invalidRole = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: admin.cookie },
      payload: { roleCode: "NOT_A_ROLE" },
    });
    expect(invalidRole.statusCode).toBe(404);
    expect(invalidRole.json().error.code).toBe("ROLE_NOT_FOUND");

    const selfChange = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.resident}/role`,
      headers: { cookie: admin.cookie },
      payload: { roleCode: "RESIDENT" },
    });
    expect(selfChange.statusCode).toBe(409);
    expect(selfChange.json().error.code).toBe("CANNOT_CHANGE_SELF");

    expect(repository.audits.map((audit) => audit.action)).toContain("member.role.changed");
  });

  it("menolak akses tanpa izin resident.manage", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const resident = await loginWeb(app);
    const denied = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: { cookie: resident.cookie },
    });
    expect(denied.statusCode).toBe(403);
  });
});
