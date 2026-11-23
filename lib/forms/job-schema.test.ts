import { describe, expect, it } from "vitest";
import type { Job } from "@/lib/api/types";
import { EMPTY_JOB_FORM, fromJob, jobFormSchema, toJobPayload, type JobValidationMessages } from "./job-schema";

const m: JobValidationMessages = {
  required: "required",
  email: "email",
  tooLong: (max) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
  url: "url",
  wholeNumber: "wholeNumber",
  currency: "currency",
  salaryIncomplete: "salaryIncomplete",
  salaryRange: "salaryRange",
};

const valid = { ...EMPTY_JOB_FORM, company: "Acme", title: "Engineer" };

function errors(values: Partial<typeof valid>) {
  const result = jobFormSchema(m).safeParse({ ...valid, ...values });
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));
}

describe("jobFormSchema", () => {
  it("needs only a company and a title", () => {
    expect(errors({})).toEqual({});
    expect(errors({ company: " ", title: "" })).toEqual({ company: "required", title: "required" });
  });

  it("accepts only http and https links", () => {
    expect(errors({ url: "https://jobs.example.com/1" })).toEqual({});
    expect(errors({ url: "ftp://example.com/1" })).toEqual({ url: "url" });
  });

  it("needs a currency and a period with an amount, and an ordered range", () => {
    expect(errors({ salaryMin: "5000" })).toEqual({ salaryCurrency: "salaryIncomplete", salaryPeriod: "salaryIncomplete" });
    expect(errors({ salaryMin: "9000", salaryMax: "5000", salaryCurrency: "mxn", salaryPeriod: "month" })).toEqual({
      salaryMax: "salaryRange",
    });
    expect(errors({ salaryMin: "5.5" })).toMatchObject({ salaryMin: "wholeNumber" });
    expect(errors({ salaryCurrency: "pesos" })).toEqual({ salaryCurrency: "currency" });
  });

  it("accepts only a real calendar day for the follow-up", () => {
    expect(errors({ nextFollowUpOn: "2026-12-01" })).toEqual({});
    expect(errors({ nextFollowUpOn: "2026-02-30" })).toHaveProperty("nextFollowUpOn");
  });
});

describe("toJobPayload", () => {
  it("turns empty fields into null, amounts into numbers and the currency into uppercase", () => {
    const payload = toJobPayload({
      ...valid,
      company: " Acme ",
      salaryMin: "4000",
      salaryMax: "6000",
      salaryCurrency: "usd",
      salaryPeriod: "month",
      workMode: "remote",
    });
    expect(payload).toMatchObject({
      company: "Acme",
      url: null,
      source: null,
      workMode: "remote",
      salaryMin: 4000,
      salaryMax: 6000,
      salaryCurrency: "USD",
      notes: null,
      nextFollowUpOn: null,
    });
  });
});

describe("fromJob", () => {
  it("fills the form from a job and round-trips through toJobPayload", () => {
    const job = {
      ...toJobPayload({ ...valid, salaryMin: "4000", salaryCurrency: "USD", salaryPeriod: "month" }),
      id: "0b8c4b5e-5d0e-4c43-9a4a-3f1f3c1d2e10",
      status: "to_review",
      criteria: { salary: null, remote: null, contract: null },
      createdAt: "2026-11-23T12:00:00.000Z",
      updatedAt: "2026-11-23T12:00:00.000Z",
    } as Job;
    const values = fromJob(job);
    expect(values.salaryMin).toBe("4000");
    expect(values.url).toBe("");
    expect(toJobPayload(values)).toMatchObject({ company: "Acme", salaryMin: 4000, salaryCurrency: "USD" });
  });
});
