import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const panel = readFileSync(resolve(import.meta.dirname, "community-admin-panel.tsx"), "utf8");

describe("community iqomah settings", () => {
  it("exposes one explicit admin control with the supported limits", () => {
    expect(panel).toContain("Jeda adzan ke iqomah");
    expect(panel).toContain('min="1"');
    expect(panel).toContain('max="60"');
    expect(panel).toContain("iqomahDelayMinutes");
    expect(panel).toContain("Simpan pengaturan shalat");
  });
});
