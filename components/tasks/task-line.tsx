"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Task } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { DeleteTaskButton } from "./delete-task-button";
import { EditTaskDialog } from "./edit-task-dialog";
import { JobLink, Meta } from "./item-parts";
import type { JobOption } from "./job-option";

/** One task: a checkbox to mark it done (or open again), its title, job and day, and edit and delete. */
export function TaskLine({
  task,
  day,
  jobs,
  showJob = true,
}: {
  task: Task;
  /** How the task's day reads in its section; nothing where the section says it (Today, No date). */
  day?: string | null;
  jobs: JobOption[];
  /** Off on the job's own page, where the link would lead back to it. */
  showJob?: boolean;
}) {
  const t = useTranslations("Tasks");
  const validation = useTranslations("Validation");
  const router = useRouter();
  // Shown at once; the refresh then moves the task to its new section.
  const [done, setDone] = useState(!!task.doneAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setDone(next);
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.PATCH("/tasks/{id}", {
        params: { path: { id: task.id } },
        body: { done: next },
      });
      if (!response.ok) {
        setDone(!next);
        setError(validation("unexpected"));
        return;
      }
      router.refresh();
    } catch {
      setDone(!next);
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Checkbox
        checked={done}
        onCheckedChange={(checked) => toggle(checked === true)}
        disabled={pending}
        aria-label={t(done ? "markOpen" : "markDone", { title: task.title })}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-sm", done && "text-muted-foreground line-through")}>{task.title}</span>
        <Meta>
          {showJob && task.job && <JobLink job={task.job} />}
          {day}
        </Meta>
        {task.notes && <span className="line-clamp-1 text-xs text-muted-foreground">{task.notes}</span>}
        {error && <FieldError>{error}</FieldError>}
      </div>
      <div className="-my-1 flex shrink-0 gap-1">
        <EditTaskDialog task={task} jobs={jobs} />
        <DeleteTaskButton task={task} />
      </div>
    </li>
  );
}
