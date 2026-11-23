import { describe, expect, it } from "vitest";
import { criteriaFormSchema, fromCriteria, toCriteriaPayload, type CriteriaFormValues } from "./criteria-schema";

const m = {
  required: "required",
  email: "email",
  tooLong: (max: number) => `tooLong:${max}`,
  passwordsDontMatch: "passwordsDontMatch",
  samePassword: "samePassword",
  url: "url",
  wholeNumber: "wholeNumber",
  currency: "currency",
  salaryIncomplete: "salaryIncomplete",
  salaryRange: "salaryRange",
  salaryTarget: "salaryTarget",
};

const empty: CriteriaFormValues = { minSalary: "", currency: "", period: "", remoteOnly: false, contractTypes: [] };

function errors(values: Partial<CriteriaFormValues>) {
  const result = criteriaFormSchema(m).safeParse({ ...empty, ...values });
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));
}

describe("criteriaFormSchema", () => {
  it("accepts no criteria at all, or a complete salary target", () => {
    expect(errors({})).toEqual({});
    expect(errors({ minSalary: "5000", currency: "usd", period: "month" })).toEqual({});
  });

  it("asks for the missing parts of a salary target", () => {
    expect(errors({ minSalary: "5000" })).toEqual({ currency: "salaryTarget", period: "salaryTarget" });
    expect(errors({ currency: "MXN" })).toEqual({ minSalary: "salaryTarget", period: "salaryTarget" });
  });

  it("refuses amounts with decimals and currencies that are not three letters", () => {
    expect(errors({ minSalary: "5000.5", currency: "USD", period: "month" })).toEqual({ minSalary: "wholeNumber" });
    expect(errors({ minSalary: "5000", currency: "dollars", period: "month" })).toEqual({ currency: "currency" });
  });
});

describe("toCriteriaPayload", () => {
  it("builds what PUT /criteria takes, and round-trips through fromCriteria", () => {
    const payload = toCriteriaPayload({
      minSalary: "5000",
      currency: "usd",
      period: "month",
      remoteOnly: true,
      contractTypes: ["contractor", "employee"],
    });
    expect(payload).toEqual({
      minSalary: 5000,
      currency: "USD",
      period: "month",
      remoteOnly: true,
      contractTypes: ["employee", "contractor"],
    });
    expect(toCriteriaPayload(fromCriteria(payload))).toEqual(payload);
  });

  it("sends no salary target when the amount is empty", () => {
    expect(toCriteriaPayload({ ...empty, remoteOnly: true })).toMatchObject({
      minSalary: null,
      currency: null,
      period: null,
    });
  });
});
