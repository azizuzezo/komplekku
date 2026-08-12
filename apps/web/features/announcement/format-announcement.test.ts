import { describe, expect, it } from "vitest";

import { formatAnnouncementDate, getPriorityLabel } from "./format-announcement";

describe("announcement formatting", () => {
  it("uses natural Indonesian priority labels", () => {
    expect(getPriorityLabel("NORMAL")).toBe("Biasa");
    expect(getPriorityLabel("IMPORTANT")).toBe("Penting");
    expect(getPriorityLabel("URGENT")).toBe("Mendesak");
  });

  it("formats timestamps in the community timezone", () => {
    const formatted = formatAnnouncementDate("2026-08-11T03:30:00.000Z");
    expect(formatted).toContain("11 Agu 2026");
    expect(formatted).toMatch(/10[.:]30/);
  });
});
