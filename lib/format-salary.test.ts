import { describe, expect, it } from "vitest";
import { formatSalary } from "./format-salary";

describe("formatSalary", () => {
  it("writes a range with its currency", () => {
    expect(formatSalary({ salaryMin: 4000, salaryMax: 6000, salaryCurrency: "USD" }, "en")).toBe("$4,000 – $6,000");
  });

  it("writes one amount when the posting gives one, or both ends are equal", () => {
    expect(formatSalary({ salaryMin: 90000, salaryMax: null, salaryCurrency: "MXN" }, "en")).toBe("MX$90,000");
    expect(formatSalary({ salaryMin: null, salaryMax: 5000, salaryCurrency: "EUR" }, "en")).toBe("€5,000");
    expect(formatSalary({ salaryMin: 5000, salaryMax: 5000, salaryCurrency: "EUR" }, "en")).toBe("€5,000");
  });

  it("answers null without a salary", () => {
    expect(formatSalary({ salaryMin: null, salaryMax: null, salaryCurrency: null }, "es")).toBeNull();
  });
});
