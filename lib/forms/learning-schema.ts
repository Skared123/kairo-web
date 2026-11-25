import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import { LEARNING_KINDS, LEARNING_STATUSES, type LearningItem } from "@/lib/api/types";
import type { ValidationMessages } from "./auth-schemas";

export type LearningPayload = paths["/learning"]["post"]["requestBody"]["content"]["application/json"];

/** The messages the learning form adds to the shared ones. */
export type LearningValidationMessages = ValidationMessages & { url: string };

/** The same limits as the API's schema (kairo-api src/learning/learning.schemas.ts); the API still decides. */
export const MAX_SKILL_NAME = 50;
export const MAX_SKILLS = 20;
const WEB_URL = z.url({ protocol: /^https?$/ });

/** How two skill names compare, as the API does (decision 040): ignoring case and extra spaces. */
export function skillKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The learning form, field by field as the inputs hold them: "" for an empty field, and the skills as the names the
 * user picked. `toLearningPayload()` turns the values into what the API takes.
 */
export function learningFormSchema(m: LearningValidationMessages) {
  return z.object({
    title: z.string().trim().min(1, m.required).max(300, m.tooLong(300)),
    kind: z.union([z.enum(LEARNING_KINDS), z.literal("")]).refine((value) => value !== "", m.required),
    url: z
      .string()
      .trim()
      .max(2000, m.tooLong(2000))
      .refine((value) => value === "" || WEB_URL.safeParse(value).success, m.url),
    status: z.enum(LEARNING_STATUSES),
    skills: z.array(z.string().trim().min(1).max(MAX_SKILL_NAME, m.tooLong(MAX_SKILL_NAME))).max(MAX_SKILLS),
    notes: z.string().trim().max(5_000, m.tooLong(5_000)),
  });
}

export type LearningFormValues = z.input<ReturnType<typeof learningFormSchema>>;

export const EMPTY_LEARNING_FORM: LearningFormValues = {
  title: "",
  kind: "",
  url: "",
  status: "to_start",
  skills: [],
  notes: "",
};

/** The API's item as form values, for editing. */
export function fromLearningItem(item: LearningItem): LearningFormValues {
  return {
    title: item.title,
    kind: item.kind,
    url: item.url ?? "",
    status: item.status,
    skills: item.skills.map((skill) => skill.name),
    notes: item.notes ?? "",
  };
}

/** Valid values as the API takes them: empty fields become null, and the skills are the whole set. */
export function toLearningPayload(values: LearningFormValues): LearningPayload {
  const text = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    title: values.title.trim(),
    kind: values.kind as LearningPayload["kind"],
    url: text(values.url),
    status: values.status,
    skills: values.skills,
    notes: text(values.notes),
  };
}
