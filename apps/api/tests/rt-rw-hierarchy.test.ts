import {
  communityMemberListResponseSchema,
  houseListResponseSchema,
  onboardingOptionsResponseSchema,
  rtListResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

const superAdminPermissions = [
  "announcement.read",
  "community.read",
  "community.manage",
  "platform.community.create",
  "home.read",
  "household.read",
  "resident.manage",
];

describe("hierarki RT/RW", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("membuka opsi onboarding dengan daftar RT per komunitas", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const applicant = await loginWeb(app, "0812 8888 0001");
    const options = await app.inject({
      method: "GET",
      url: "/api/v1/onboarding/options",
      headers: { cookie: applicant.cookie },
    });
    expect(options.statusCode).toBe(200);
    expect(onboardingOptionsResponseSchema.safeParse(options.json()).success).toBe(true);
    const billabong = options
      .json()
      .data.communities.find((community: { id: string }) => community.id === demoIds.community);
    expect(billabong.rts.map((rt: { code: string }) => rt.code)).toEqual(
      expect.arrayContaining(["RT 01", "RT 02"]),
    );
  });

  it("menolak RT_ADMIN mengelola struktur komunitas dan RT", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const superAdmin = await loginWeb(app);
    repository.setPermissions(demoIds.user, superAdminPermissions);

    const promote = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: superAdmin.cookie },
      payload: { roleCode: "RT_ADMIN", rtId: demoIds.rtOne },
    });
    expect(promote.statusCode).toBe(200);

    const rtAdmin = await loginWeb(app, "0812 0000 0003");
    const deniedCommunityEdit = await app.inject({
      method: "PATCH",
      url: "/api/v1/admin/community",
      headers: { cookie: rtAdmin.cookie },
      payload: { rwLabel: "RW 99" },
    });
    expect(deniedCommunityEdit.statusCode).toBe(403);

    const deniedRtCreate = await app.inject({
      method: "POST",
      url: "/api/v1/admin/rts",
      headers: { cookie: rtAdmin.cookie },
      payload: { code: "RT 03", name: "RT 03" },
    });
    expect(deniedRtCreate.statusCode).toBe(403);
  });

  it("membatasi RT_ADMIN melihat rumah dan warga hanya di RT miliknya", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const superAdmin = await loginWeb(app);
    repository.setPermissions(demoIds.user, superAdminPermissions);

    // demoIds.securityResident lives in RT 01 (F03); scope RT_ADMIN there.
    const promote = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: superAdmin.cookie },
      payload: { roleCode: "RT_ADMIN", rtId: demoIds.rtOne },
    });
    expect(promote.statusCode).toBe(200);

    const rtAdmin = await loginWeb(app, "0812 0000 0003");

    const houses = await app.inject({
      method: "GET",
      url: "/api/v1/houses",
      headers: { cookie: rtAdmin.cookie },
    });
    expect(houses.statusCode).toBe(200);
    expect(houseListResponseSchema.safeParse(houses.json()).success).toBe(true);
    const houseIds = houses.json().data.items.map((house: { id: string }) => house.id);
    expect(houseIds).toContain(demoIds.house); // F01, RT 01
    expect(houseIds).not.toContain(demoIds.treasurerHouse); // F04, RT 02

    const members = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: { cookie: rtAdmin.cookie },
    });
    expect(members.statusCode).toBe(200);
    expect(communityMemberListResponseSchema.safeParse(members.json()).success).toBe(true);
    const memberIds = members
      .json()
      .data.items.map((member: { residentId: string }) => member.residentId);
    expect(memberIds).toContain(demoIds.resident); // Billabong resident, RT 01
    expect(memberIds).not.toContain(demoIds.treasurerResident); // RT 02

    const rts = await app.inject({
      method: "GET",
      url: "/api/v1/admin/rts",
      headers: { cookie: rtAdmin.cookie },
    });
    expect(rts.statusCode).toBe(200);
    expect(rtListResponseSchema.safeParse(rts.json()).success).toBe(true);
  });

  it("mencegah RT_ADMIN meningkatkan peran dirinya sendiri ke SUPER_ADMIN atau COMMUNITY_ADMIN", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const superAdmin = await loginWeb(app);
    repository.setPermissions(demoIds.user, superAdminPermissions);

    await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.securityResident}/role`,
      headers: { cookie: superAdmin.cookie },
      payload: { roleCode: "RT_ADMIN", rtId: demoIds.rtOne },
    });

    const rtAdmin = await loginWeb(app, "0812 0000 0003");
    const escalate = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/users/${demoIds.treasurerResident}/role`,
      headers: { cookie: rtAdmin.cookie },
      payload: { roleCode: "COMMUNITY_ADMIN" },
    });
    expect(escalate.statusCode).toBe(403);
  });
});
