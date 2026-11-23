import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import type { Job } from "@/lib/api/types";
import type { ValidationMessages } from "./auth-schemas";

export type JobPayload = paths["/jobs"]["post"]["requestBody"]["content"]["application/json"];

export const JOB_SOURCES = ["linkedin", "referral", "company_site", "job_board", "recruiter", "other"] as const;
export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const CONTRACT_TYPES = ["employee", "contractor"] as const;
export const SALARY_PERIODS = ["month", "year"] as const;

/** The messages the job form adds to the shared ones. */
export type JobValidationMessages = ValidationMessages & {
  url: string;
  wholeNumber: string;
  currency: string;
  salaryIncomplete: string;
  salaryRange: string;
};

// The same limits as the API's schema (kairo-api src/jobs/jobs.schemas.ts); the API still decides (decision 024).
const optionalText = (m: ValidationMessages, max: number) => z.string().trim().max(max, m.tooLong(max));
const choice = <T extends readonly [string, ...string[]]>(values: T) => z.union([z.enum(values), z.literal("")]);

/**
 * The job form, field by field as the inputs hold them: text everywhere, "" for an empty field. `toJobPayload()` turns
 * the values into what the API takes.
 */
export function jobFormSchema(m: JobValidationMessages) {
  return z
    .object({
      company: z.string().trim().min(1, m.required).max(200, m.tooLong(200)),
      title: z.string().trim().min(1, m.required).max(200, m.tooLong(200)),
      url: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: m.url }).max(2000, m.tooLong(2000))]),
      source: choice(JOB_SOURCES),
      workMode: choice(WORK_MODES),
      location: optionalText(m, 200),
      timeZoneNotes: optionalText(m, 500),
      contractType: choice(CONTRACT_TYPES),
      salaryMin: z.string().trim().regex(/^\d*$/, m.wholeNumber),
      salaryMax: z.string().trim().regex(/^\d*$/, m.wholeNumber),
      salaryCurrency: z
        .string()
        .trim()
        .regex(/^([A-Za-z]{3})?$/, m.currency),
      salaryPeriod: choice(SALARY_PERIODS),
      description: optionalText(m, 20_000),
      notes: optionalText(m, 5_000),
      nextFollowUpOn: z.union([z.literal(""), z.iso.date()]),
      nextFollowUpNote: optionalText(m, 500),
    })
    .superRefine((values, ctx) => {
      // An amount needs its currency and period, and the range must be in order (API decision 029).
      const hasAmount = values.salaryMin !== "" || values.salaryMax !== "";
      if (hasAmount && values.salaryCurrency === "") {
        ctx.addIssue({ code: "custom", path: ["salaryCurrency"], message: m.salaryIncomplete });
      }
      if (hasAmount && values.salaryPeriod === "") {
        ctx.addIssue({ code: "custom", path: ["salaryPeriod"], message: m.salaryIncomplete });
      }
      if (values.salaryMin !== "" && values.salaryMax !== "" && Number(values.salaryMin) > Number(values.salaryMax)) {
        ctx.addIssue({ code: "custom", path: ["salaryMax"], message: m.salaryRange });
      }
    });
}
export type JobFormValues = z.input<ReturnType<typeof jobFormSchema>>;

export const EMPTY_JOB_FORM: JobFormValues = {
  company: "",
  title: "",
  url: "",
  source: "",
  workMode: "",
  location: "",
  timeZoneNotes: "",
  contractType: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "",
  salaryPeriod: "",
  description: "",
  notes: "",
  nextFollowUpOn: "",
  nextFollowUpNote: "",
};

/** The API's job as form values, for editing. */
export function fromJob(job: Job): JobFormValues {
  const text = (value: string | null) => value ?? "";
  const amount = (value: number | null) => (value === null ? "" : String(value));
  return {
    company: job.company,
    title: job.title,
    url: text(job.url),
    source: job.source ?? "",
    workMode: job.workMode ?? "",
    location: text(job.location),
    timeZoneNotes: text(job.timeZoneNotes),
    contractType: job.contractType ?? "",
    salaryMin: amount(job.salaryMin),
    salaryMax: amount(job.salaryMax),
    salaryCurrency: text(job.salaryCurrency),
    salaryPeriod: job.salaryPeriod ?? "",
    description: text(job.description),
    notes: text(job.notes),
    nextFollowUpOn: text(job.nextFollowUpOn),
    nextFollowUpNote: text(job.nextFollowUpNote),
  };
}

/** Valid form values as the API takes them: empty fields become null, so an edit can also clear them. */
export function toJobPayload(values: JobFormValues): JobPayload {
  const text = (value: string) => (value.trim() === "" ? null : value.trim());
  const amount = (value: string) => (value.trim() === "" ? null : Number(value));
  return {
    company: values.company.trim(),
    title: values.title.trim(),
    url: text(values.url),
    source: values.source || null,
    workMode: values.workMode || null,
    location: text(values.location),
    timeZoneNotes: text(values.timeZoneNotes),
    contractType: values.contractType || null,
    salaryMin: amount(values.salaryMin),
    salaryMax: amount(values.salaryMax),
    salaryCurrency: text(values.salaryCurrency)?.toUpperCase() ?? null,
    salaryPeriod: values.salaryPeriod || null,
    description: text(values.description),
    notes: text(values.notes),
    nextFollowUpOn: text(values.nextFollowUpOn),
    nextFollowUpNote: text(values.nextFollowUpNote),
  };
}
