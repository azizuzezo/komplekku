import {
  addHouseholdMemberResponseSchema,
  currentHouseholdResponseSchema,
  removeHouseholdMemberResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("anggota rumah tangga", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("menambah anggota baru, memberi mereka akun aktif, lalu menghapusnya", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const head = await loginWeb(app);

    const before = await app.inject({
      method: "GET",
      url: "/api/v1/household/current",
      headers: { cookie: head.cookie },
    });
    expect(before.statusCode).toBe(200);
    expect(currentHouseholdResponseSchema.safeParse(before.json()).success).toBe(true);
    expect(before.json().data.household.members).toHaveLength(1);

    const added = await app.inject({
      method: "POST",
      url: "/api/v1/household/members",
      headers: { cookie: head.cookie },
      payload: {
        fullName: "Nadia Anggota",
        phone: "0812 8888 0001",
        relationship: "SPOUSE",
      },
    });
    expect(added.statusCode).toBe(201);
    expect(addHouseholdMemberResponseSchema.safeParse(added.json()).success).toBe(true);
    expect(added.json().data.member.displayName).toBe("Nadia Anggota");
    expect(added.json().data.member.relationship).toBe("SPOUSE");
    const newResidentId = added.json().data.member.residentId as string;

    const afterAdd = await app.inject({
      method: "GET",
      url: "/api/v1/household/current",
      headers: { cookie: head.cookie },
    });
    expect(afterAdd.json().data.household.members).toHaveLength(2);

    // The new member gets a genuinely usable account: they can log in with
    // their own phone and land with an already-active household context.
    const newMember = await loginWeb(app, "0812 8888 0001");
    const newMemberMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: newMember.cookie },
    });
    expect(newMemberMe.json().data.authState).toBe("READY");
    expect(newMemberMe.json().data.currentContext.household.id).toBe(
      before.json().data.household.id,
    );

    const duplicateAdd = await app.inject({
      method: "POST",
      url: "/api/v1/household/members",
      headers: { cookie: head.cookie },
      payload: {
        fullName: "Nadia Anggota",
        phone: "0812 8888 0001",
        relationship: "SPOUSE",
      },
    });
    expect(duplicateAdd.statusCode).toBe(409);
    expect(duplicateAdd.json().error.code).toBe("HOUSEHOLD_MEMBER_EXISTS");

    const selfRemoval = await app.inject({
      method: "DELETE",
      url: `/api/v1/household/members/${demoIds.resident}`,
      headers: { cookie: head.cookie },
    });
    expect(selfRemoval.statusCode).toBe(409);
    expect(selfRemoval.json().error.code).toBe("HOUSEHOLD_MEMBER_IS_SELF");

    const removed = await app.inject({
      method: "DELETE",
      url: `/api/v1/household/members/${newResidentId}`,
      headers: { cookie: head.cookie },
    });
    expect(removed.statusCode).toBe(200);
    expect(removeHouseholdMemberResponseSchema.safeParse(removed.json()).success).toBe(true);

    const afterRemove = await app.inject({
      method: "GET",
      url: "/api/v1/household/current",
      headers: { cookie: head.cookie },
    });
    expect(afterRemove.json().data.household.members).toHaveLength(1);

    const notFoundAgain = await app.inject({
      method: "DELETE",
      url: `/api/v1/household/members/${newResidentId}`,
      headers: { cookie: head.cookie },
    });
    expect(notFoundAgain.statusCode).toBe(404);
  });

  it("menolak menambah anggota tanpa izin household.manage", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const viewer = await loginWeb(app);
    repository.setPermissions(viewer.response.json().data.user.id, ["household.read"]);

    const denied = await app.inject({
      method: "POST",
      url: "/api/v1/household/members",
      headers: { cookie: viewer.cookie },
      payload: {
        fullName: "Nadia Anggota",
        phone: "0812 8888 0002",
        relationship: "SPOUSE",
      },
    });
    expect(denied.statusCode).toBe(403);
  });
});
