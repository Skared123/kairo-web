import { z } from "zod";
import type { ValidationMessages } from "./auth-schemas";

export type PostponeMessages = Pick<ValidationMessages, "required"> & { notBeforeToday: string };

/** The quick choices in the postpone dialog: how many days after today. */
export const POSTPONE_CHOICES = [1, 3, 7] as const;

/**
 * The new day of a follow-up: today or later, by the browser's `today` (YYYY-MM-DD, API decision 035). An empty input
 * is "required", not an invalid date.
 */
export function postponeSchema(m: PostponeMessages, today: string) {
  return z.object({
    on: z
      .string()
      .min(1, m.required)
      .pipe(z.iso.date(m.required))
      // Days as YYYY-MM-DD sort as text.
      .refine((on) => on >= today, m.notBeforeToday),
  });
}

export type PostponeValues = z.infer<ReturnType<typeof postponeSchema>>;
