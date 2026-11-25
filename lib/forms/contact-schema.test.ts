import { describe, expect, it } from "vitest";
import type { Contact } from "@/lib/api/types";
import { contactFormSchema, EMPTY_CONTACT_FORM, fromContact, toContactPayload } from "./contact-schema";

const m = {
  required: "required",
  email: "email",
  tooLong: (max: number) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
  url: "url",
};

const schema = contactFormSchema(m);

function errors(values: Partial<typeof EMPTY_CONTACT_FORM>) {
  const result = schema.safeParse({ ...EMPTY_CONTACT_FORM, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("contactFormSchema", () => {
  it("needs only a name", () => {
    expect(errors({})).toEqual({ name: "required" });
    expect(errors({ name: "   " })).toEqual({ name: "required" });
    expect(errors({ name: "Margaret Hamilton" })).toEqual({});
  });

  it("checks the email, the LinkedIn link and the day", () => {
    const valid = {
      name: "x",
      email: " margaret@example.com ",
      linkedinUrl: "https://www.linkedin.com/in/example",
      nextFollowUpOn: "2026-12-01",
    };
    expect(errors(valid)).toEqual({});
    expect(errors({ name: "x", email: "margaret" })).toEqual({ email: "email" });
    expect(errors({ name: "x", linkedinUrl: "linkedin.com/in/example" })).toEqual({ linkedinUrl: "url" });
    expect(errors({ name: "x", linkedinUrl: "javascript:alert(1)" })).toEqual({ linkedinUrl: "url" });
    expect(errors({ name: "x", nextFollowUpOn: "tomorrow" })).toHaveProperty("nextFollowUpOn");
  });

  it("keeps the API's lengths", () => {
    expect(errors({ name: "x".repeat(201) })).toEqual({ name: "tooLong:200" });
    expect(errors({ name: "x", phone: "1".repeat(51) })).toEqual({ phone: "tooLong:50" });
  });
});

describe("toContactPayload and fromContact", () => {
  it("sends null for every empty field, so an edit can clear it", () => {
    expect(toContactPayload({ ...EMPTY_CONTACT_FORM, name: " Margaret Hamilton " })).toEqual({
      name: "Margaret Hamilton",
      company: null,
      role: null,
      kind: null,
      email: null,
      phone: null,
      linkedinUrl: null,
      notes: null,
      nextFollowUpOn: null,
      nextFollowUpNote: null,
    });
  });

  it("round-trips a contact through the form", () => {
    const contact = {
      id: "6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f",
      name: "Margaret Hamilton",
      company: "Acme Robotics",
      role: "Talent Partner",
      kind: "recruiter",
      email: "margaret@example.com",
      phone: null,
      linkedinUrl: "https://www.linkedin.com/in/example",
      notes: null,
      nextFollowUpOn: "2026-12-01",
      nextFollowUpNote: "Send the portfolio",
      lastInteractionOn: null,
      jobs: [],
      createdAt: "2026-11-24T00:00:00.000Z",
      updatedAt: "2026-11-24T00:00:00.000Z",
    } satisfies Contact;
    expect(toContactPayload(fromContact(contact))).toMatchObject({
      name: "Margaret Hamilton",
      kind: "recruiter",
      phone: null,
      nextFollowUpOn: "2026-12-01",
    });
  });
});
