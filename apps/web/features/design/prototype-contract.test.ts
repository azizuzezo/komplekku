import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(import.meta.dirname, "../../../..");

function source(path: string) {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("owner prototype design contract", () => {
  it("uses the approved Komplekku brand palette as the shared web source of truth", () => {
    const tokens = source("tokens.css");

    expect(tokens).toContain("--color-brand: #4b2da1");
    expect(tokens).toContain("--color-brand-deep: #32178f");
    expect(tokens).toContain("--color-brand-wash: #eee9ff");
    expect(tokens).toContain("--color-accent: #32bce3");
    expect(tokens).toContain("--color-logo-accent: #ffeb22");
    expect(tokens).toContain("--color-success: #20a464");
    expect(tokens).toContain("--color-danger: #e5484d");
    expect(tokens).toContain("--color-paper: #ffffff");
    expect(tokens).not.toContain("#008a52");
  });

  it("keeps exactly the five prototype bottom-navigation destinations", () => {
    const navigation = source("apps/web/components/shell/mobile-navigation.tsx");

    for (const label of ["Beranda", "Shalat", "Pengumuman", "Forum", "Profil"]) {
      expect(navigation).toContain(`label: "${label}"`);
    }
    expect(navigation.match(/label: "/g)).toHaveLength(5);
  });

  it("uses the prototype screen structure and has no manual adzan replay", () => {
    const files = [
      "apps/web/features/home/home-screen.tsx",
      "apps/web/features/prayer/prayer-card.tsx",
      "apps/web/features/announcement/announcement-list.tsx",
      "apps/web/features/forum/forum-board.tsx",
      "apps/web/features/forum/forum-post-detail.tsx",
    ].map(source);
    const joined = files.join("\n");

    for (const className of [
      "prototype-home",
      "prototype-prayer",
      "prototype-announcements",
      "prototype-forum",
      "prototype-discussion",
    ]) {
      expect(joined).toContain(className);
    }
    expect(source("apps/web/features/prayer/prayer-card.tsx")).not.toMatch(
      /Putar Suara Adzan|btn-adzan|playAdzanAudio/,
    );
  });
});
