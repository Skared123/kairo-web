import type { Job } from "@/lib/api/types";

/** A job a task can be linked to, as the job select lists it. */
export type JobOption = { id: string; label: string };

/** The user's jobs as select options, by company. */
export function toJobOptions(jobs: Pick<Job, "id" | "company" | "title">[]): JobOption[] {
  return jobs
    .map((job) => ({ id: job.id, label: `${job.company} · ${job.title}` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
