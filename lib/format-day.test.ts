import { describe, expect, it } from "vitest";
import { formatDay } from "./format-day";

describe("formatDay", () => {
  it("writes the same calendar day whatever the time zone", () => {
    expect(formatDay("2026-12-01", "en")).toBe("Dec 1, 2026");
    expect(formatDay("2026-12-31", "es")).toContain("31");
    expect(formatDay("2026-01-01", "es")).toContain("2026");
  });
});
