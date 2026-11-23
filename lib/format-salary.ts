import type { Job } from "@/lib/api/types";

/**
 * A job's salary in the page's language, such as "USD 4,000 – 6,000" or "MX$90,000", or null when the job gives
 * none. Amounts are whole units (API decision 029); the period is shown apart.
 */
export function formatSalary(
  job: Pick<Job, "salaryMin" | "salaryMax" | "salaryCurrency">,
  locale: string,
): string | null {
  const { salaryMin, salaryMax, salaryCurrency } = job;
  if (salaryCurrency === null || (salaryMin === null && salaryMax === null)) {
    return null;
  }
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: salaryCurrency, maximumFractionDigits: 0 });
  if (salaryMin !== null && salaryMax !== null && salaryMin !== salaryMax) {
    return money.formatRange(salaryMin, salaryMax);
  }
  return money.format((salaryMax ?? salaryMin)!);
}
