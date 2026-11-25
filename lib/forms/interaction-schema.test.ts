import { describe, expect, it } from "vitest";
import { emptyInteraction, interactionFormSchema, toInteractionPayload } from "./interaction-schema";

const m = {
  required: "required",
  email: "email",
  tooLong: (max: number) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
};

const schema = interactionFormSchema(m);

function errors(values: Record<string, string>) {
  const result = schema.safeParse({ ...emptyInteraction("2026-11-24"), ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("interactionFormSchema", () => {
  it("starts on today and needs a channel", () => {
    expect(emptyInteraction("2026-11-24")).toEqual({ occurredOn: "2026-11-24", channel: "", note: "" });
    expect(errors({})).toEqual({ channel: "required" });
    expect(errors({ channel: "call" })).toEqual({});
  });

  it("needs a valid day and keeps the note's length", () => {
    expect(errors({ channel: "call", occurredOn: "" })).toEqual({ occurredOn: "required" });
    expect(errors({ channel: "call", occurredOn: "2026-02-30" })).toEqual({ occurredOn: "required" });
    expect(errors({ channel: "call", note: "x".repeat(2_001) })).toEqual({ note: "tooLong:2000" });
  });

  it("sends a null note when it is empty", () => {
    expect(toInteractionPayload({ occurredOn: "2026-11-24", channel: "email", note: "  " })).toEqual({
      occurredOn: "2026-11-24",
      channel: "email",
      note: null,
    });
  });
});
