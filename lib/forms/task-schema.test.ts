import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/api/types";
import { EMPTY_TASK_FORM, fromTask, taskFormSchema, toTaskPayload } from "./task-schema";

const m = {
  required: "required",
  email: "email",
  tooLong: (max: number) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
};

const schema = taskFormSchema(m);
const JOB_ID = "6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f";

function errors(values: Partial<typeof EMPTY_TASK_FORM>) {
  const result = schema.safeParse({ ...EMPTY_TASK_FORM, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("taskFormSchema", () => {
  it("needs only a title", () => {
    expect(errors({})).toEqual({ title: "required" });
    expect(errors({ title: "   " })).toEqual({ title: "required" });
    expect(errors({ title: "Send the CV" })).toEqual({});
  });

  it("checks the day, the job and the lengths", () => {
    expect(errors({ title: "x", dueOn: "2026-12-01", jobId: JOB_ID })).toEqual({});
    expect(errors({ title: "x", dueOn: "tomorrow" })).toHaveProperty("dueOn");
    expect(errors({ title: "x", jobId: "acme" })).toHaveProperty("jobId");
    expect(errors({ title: "x".repeat(201) })).toEqual({ title: "tooLong:200" });
    expect(errors({ title: "x", notes: "x".repeat(5_001) })).toEqual({ notes: "tooLong:5000" });
  });
});

describe("toTaskPayload and fromTask", () => {
  it("sends null for every empty field, so an edit clears it", () => {
    expect(toTaskPayload({ title: " Send the CV ", dueOn: "", jobId: "", notes: "  " })).toEqual({
      title: "Send the CV",
      dueOn: null,
      jobId: null,
      notes: null,
    });
  });

  it("goes from a saved task to the form and back", () => {
    const task: Task = {
      id: "0d9f8e7c-6b5a-4c3d-8e2f-1a0b9c8d7e6f",
      title: "Prepare the interview",
      notes: "Questions about the team",
      dueOn: "2026-12-01",
      job: { id: JOB_ID, company: "Acme", title: "Engineer" },
      doneAt: null,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    };
    expect(toTaskPayload(fromTask(task))).toEqual({
      title: "Prepare the interview",
      dueOn: "2026-12-01",
      jobId: JOB_ID,
      notes: "Questions about the team",
    });
  });
});
