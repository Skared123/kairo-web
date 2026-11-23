import { describe, expect, it } from "vitest";
import { createAccountSchema } from "./account-schemas";
import { changePasswordSchema, setupSchema, signInSchema, type ValidationMessages } from "./auth-schemas";

// Plain keys stand in for the translated messages, so the tests check which rule failed.
const m: ValidationMessages = {
  required: "required",
  email: "email",
  tooLong: (max) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
};

/** The messages of the issues for one field, or [] when it passed. */
function errorsFor(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  return result.error?.issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message) ?? [];
}

describe("signInSchema", () => {
  it("accepts an email with spaces around it and any non-empty password", () => {
    const result = signInSchema(m).safeParse({ email: "  ada@example.com ", password: "a" });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("ada@example.com");
  });

  it("requires both fields and a valid email", () => {
    const result = signInSchema(m).safeParse({ email: "", password: "" });
    expect(errorsFor(result, "email")).toEqual(["required"]);
    expect(errorsFor(result, "password")).toEqual(["required"]);
    expect(errorsFor(signInSchema(m).safeParse({ email: "nope", password: "a" }), "email")).toEqual(["email"]);
  });

  it("caps passwords at 128 characters, like the API", () => {
    const result = signInSchema(m).safeParse({ email: "ada@example.com", password: "x".repeat(129) });
    expect(errorsFor(result, "password")).toEqual(["tooLong:128"]);
  });
});

describe("setupSchema", () => {
  it("accepts a short password such as abc123 (API decision 015)", () => {
    expect(setupSchema(m).safeParse({ name: "Ada", email: "ada@example.com", password: "abc123" }).success).toBe(true);
  });

  it("requires a name of at most 100 characters", () => {
    expect(errorsFor(setupSchema(m).safeParse({ name: "  ", email: "a@b.co", password: "x" }), "name")).toEqual([
      "required",
    ]);
    expect(
      errorsFor(setupSchema(m).safeParse({ name: "x".repeat(101), email: "a@b.co", password: "x" }), "name"),
    ).toEqual(["tooLong:100"]);
  });
});

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "temp-1234", newPassword: "abc123", confirmPassword: "abc123" };

  it("accepts a new password that differs from the current one and is confirmed", () => {
    expect(changePasswordSchema(m).safeParse(valid).success).toBe(true);
  });

  it("asks for a matching confirmation", () => {
    const result = changePasswordSchema(m).safeParse({ ...valid, confirmPassword: "abc124" });
    expect(errorsFor(result, "confirmPassword")).toEqual(["passwordsDontMatch"]);
  });

  it("refuses the current password as the new one", () => {
    const result = changePasswordSchema(m).safeParse({ ...valid, newPassword: "temp-1234", confirmPassword: "temp-1234" });
    expect(errorsFor(result, "newPassword")).toEqual(["samePassword"]);
  });
});

describe("createAccountSchema", () => {
  it("accepts a user or an admin", () => {
    for (const role of ["user", "admin"] as const) {
      expect(createAccountSchema(m).safeParse({ name: "Grace", email: "grace@example.com", role }).success).toBe(true);
    }
  });

  it("refuses any other role", () => {
    expect(createAccountSchema(m).safeParse({ name: "Grace", email: "grace@example.com", role: "owner" }).success).toBe(
      false,
    );
  });
});
