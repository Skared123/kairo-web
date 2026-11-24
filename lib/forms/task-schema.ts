import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import type { Task } from "@/lib/api/types";
import type { ValidationMessages } from "./auth-schemas";

export type TaskPayload = paths["/tasks"]["post"]["requestBody"]["content"]["application/json"];

/**
 * The task form (quick add and edit), as the inputs hold it: "" for an empty field. The same limits as the API's
 * schema (kairo-api src/tasks/tasks.schemas.ts); the API still decides (decision 024).
 */
export function taskFormSchema(m: ValidationMessages) {
  return z.object({
    title: z.string().trim().min(1, m.required).max(200, m.tooLong(200)),
    dueOn: z.union([z.literal(""), z.iso.date()]),
    jobId: z.union([z.literal(""), z.uuid()]),
    notes: z.string().trim().max(5_000, m.tooLong(5_000)),
  });
}
export type TaskFormValues = z.infer<ReturnType<typeof taskFormSchema>>;

export const EMPTY_TASK_FORM: TaskFormValues = { title: "", dueOn: "", jobId: "", notes: "" };

/** A saved task, as the edit form holds it. */
export function fromTask(task: Task): TaskFormValues {
  return { title: task.title, dueOn: task.dueOn ?? "", jobId: task.job?.id ?? "", notes: task.notes ?? "" };
}

/** What the API takes: every empty field becomes null, so an edit can clear it. */
export function toTaskPayload(values: TaskFormValues): TaskPayload {
  const orNull = (value: string) => (value.trim() === "" ? null : value.trim());
  return { title: values.title.trim(), dueOn: orNull(values.dueOn), jobId: orNull(values.jobId), notes: orNull(values.notes) };
}
