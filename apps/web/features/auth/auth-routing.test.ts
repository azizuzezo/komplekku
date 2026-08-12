import { describe, expect, it } from "vitest";

import { canStartResidencyRequest, destinationForAuthState } from "./auth-routing";

describe("auth destination routing", () => {
  it("keeps every backend auth state on an implemented local route", () => {
    expect(destinationForAuthState("READY")).toBe("/");
    expect(destinationForAuthState("NEEDS_RESIDENCY")).toBe("/mulai/komunitas");
    expect(destinationForAuthState("PENDING_APPROVAL")).toBe("/menunggu-verifikasi");
    expect(destinationForAuthState("CONTEXT_REQUIRED")).toBe("/status-akun");
    expect(destinationForAuthState("REJECTED")).toBe("/status-akun");
    expect(destinationForAuthState("SUSPENDED")).toBe("/status-akun");
    expect(destinationForAuthState("ACCOUNT_CONFIGURATION_REQUIRED")).toBe("/status-akun");
  });

  it("allows a rejected resident to submit a corrected residency request", () => {
    expect(canStartResidencyRequest("NEEDS_RESIDENCY")).toBe(true);
    expect(canStartResidencyRequest("REJECTED")).toBe(true);
    expect(canStartResidencyRequest("PENDING_APPROVAL")).toBe(false);
    expect(canStartResidencyRequest("READY")).toBe(false);
  });
});
