import { describe, expect, it } from "vitest";
import { postponeSchema } from "./postpone-schema";

const schema = postponeSchema({ required: "required", notBeforeToday: "notBeforeToday" }, "2026-11-24");

function error(on: string) {
  const result = schema.safeParse({ on });
  return result.success ? null : result.error.issues[0].message;
}

describe("postponeSchema", () => {
  it("takes today or any later day", () => {
    expect(error("2026-11-24")).toBeNull();
    expect(error("2026-11-25")).toBeNull();
    expect(error("2027-01-01")).toBeNull();
  });

  it("rejects an earlier day", () => {
    expect(error("2026-11-23")).toBe("notBeforeToday");
    expect(error("2025-12-31")).toBe("notBeforeToday");
  });

  it("needs a day", () => {
    expect(error("")).toBe("required");
    expect(error("tomorrow")).toBe("required");
  });
});
