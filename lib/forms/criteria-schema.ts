import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import { CONTRACT_TYPES, SALARY_PERIODS } from "./job-schema";
import type { JobValidationMessages } from "./job-schema";

export type Criteria = paths["/criteria"]["get"]["responses"][200]["content"]["application/json"];

/** The criteria form, as the inputs hold it. `toCriteriaPayload()` turns it into what PUT /criteria takes. */
export function criteriaFormSchema(m: JobValidationMessages & { salaryTarget: string }) {
  return z
    .object({
      minSalary: z.string().trim().regex(/^\d*$/, m.wholeNumber),
      currency: z
        .string()
        .trim()
        .regex(/^([A-Za-z]{3})?$/, m.currency),
      period: z.union([z.enum(SALARY_PERIODS), z.literal("")]),
      remoteOnly: z.boolean(),
      contractTypes: z.array(z.enum(CONTRACT_TYPES)),
    })
    .superRefine((values, ctx) => {
      // The target salary, its currency and its period go together, or none of them (API decision 029).
      const set = [values.minSalary, values.currency, values.period].filter((value) => value !== "").length;
      if (set > 0 && set < 3) {
        for (const path of ["minSalary", "currency", "period"] as const) {
          if (values[path] === "") {
            ctx.addIssue({ code: "custom", path: [path], message: m.salaryTarget });
          }
        }
      }
    });
}
export type CriteriaFormValues = z.input<ReturnType<typeof criteriaFormSchema>>;

export function fromCriteria(criteria: Criteria): CriteriaFormValues {
  return {
    minSalary: criteria.minSalary === null ? "" : String(criteria.minSalary),
    currency: criteria.currency ?? "",
    period: criteria.period ?? "",
    remoteOnly: criteria.remoteOnly,
    contractTypes: [...criteria.contractTypes],
  };
}

export function toCriteriaPayload(values: CriteriaFormValues): Criteria {
  const hasTarget = values.minSalary.trim() !== "";
  return {
    minSalary: hasTarget ? Number(values.minSalary) : null,
    currency: hasTarget ? values.currency.trim().toUpperCase() : null,
    period: hasTarget && values.period !== "" ? values.period : null,
    remoteOnly: values.remoteOnly,
    // In the order the API lists them, whatever order they were ticked in.
    contractTypes: CONTRACT_TYPES.filter((type) => values.contractTypes.includes(type)),
  };
}
