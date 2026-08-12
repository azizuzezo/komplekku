import { describe, expect, it } from "vitest";

import { agendaListPath } from "./agenda-api";
import { formatAgendaDate, formatAgendaTimeRange, getAgendaDateParts } from "./format-agenda";

describe("agenda presentation", () => {
  it("keeps community calendar dates stable without a timezone shift", () => {
    expect(formatAgendaDate("2026-08-17")).toContain("17 Agustus 2026");
    expect(getAgendaDateParts("2026-08-17")).toEqual({ day: "17", month: "Agu" });
    expect(formatAgendaTimeRange("07:00", "09:30")).toBe("07:00–09:30");
  });

  it("builds only real cursor pagination parameters", () => {
    expect(
      agendaListPath({
        view: "past",
        limit: 10,
        cursor: "00000000-0000-4000-8000-000000000601",
      }),
    ).toBe("/agenda?view=past&limit=10&cursor=00000000-0000-4000-8000-000000000601");
  });
});
