import { describe, expect, it } from "vitest";
import type { LearningItem } from "@/lib/api/types";
import {
  EMPTY_LEARNING_FORM,
  fromLearningItem,
  learningFormSchema,
  skillKey,
  toLearningPayload,
} from "./learning-schema";

const m = {
  required: "required",
  email: "email",
  tooLong: (max: number) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
  url: "url",
};

const schema = learningFormSchema(m);

function errors(values: Partial<typeof EMPTY_LEARNING_FORM>) {
  const result = schema.safeParse({ ...EMPTY_LEARNING_FORM, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("learningFormSchema", () => {
  it("needs a title and a kind, and starts to start", () => {
    expect(EMPTY_LEARNING_FORM.status).toBe("to_start");
    expect(errors({})).toEqual({ title: "required", kind: "required" });
    expect(errors({ title: "NestJS Fundamentals", kind: "course" })).toEqual({});
  });

  it("checks the link only when filled in", () => {
    expect(errors({ title: "x", kind: "video", url: "https://example.com/talk" })).toEqual({});
    expect(errors({ title: "x", kind: "video", url: "example.com/talk" })).toEqual({ url: "url" });
    expect(errors({ title: "x", kind: "video", url: "javascript:alert(1)" })).toEqual({ url: "url" });
  });

  it("keeps the API's limits on skills", () => {
    expect(errors({ title: "x", kind: "book", skills: ["x".repeat(51)] })).toEqual({ skills: "tooLong:50" });
    expect(errors({ title: "x", kind: "book", skills: Array.from({ length: 21 }, (_, i) => `s${i}`) })).toHaveProperty(
      "skills",
    );
  });
});

describe("skillKey", () => {
  it("compares names as the API does", () => {
    expect(skillKey(" TypeScript ")).toBe(skillKey("typescript"));
    expect(skillKey("System  Design")).toBe("system design");
  });
});

describe("toLearningPayload and fromLearningItem", () => {
  it("sends null for empty fields and the whole set of skills", () => {
    expect(toLearningPayload({ ...EMPTY_LEARNING_FORM, title: " DDIA ", kind: "book" })).toEqual({
      title: "DDIA",
      kind: "book",
      url: null,
      status: "to_start",
      skills: [],
      notes: null,
    });
  });

  it("round-trips an item through the form", () => {
    const item = {
      id: "6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f",
      title: "NestJS Fundamentals",
      kind: "course",
      url: "https://example.com/nestjs",
      status: "in_progress",
      finishedAt: null,
      isFocus: false,
      notes: null,
      skills: [{ id: "7f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f", name: "NestJS" }],
      createdAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z",
    } satisfies LearningItem;
    expect(toLearningPayload(fromLearningItem(item))).toEqual({
      title: "NestJS Fundamentals",
      kind: "course",
      url: "https://example.com/nestjs",
      status: "in_progress",
      skills: ["NestJS"],
      notes: null,
    });
  });
});
