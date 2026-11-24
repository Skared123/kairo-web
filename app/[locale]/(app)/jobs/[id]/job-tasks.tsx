import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { JobOption } from "@/components/tasks/job-option";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskLine } from "@/components/tasks/task-line";
import type { Task } from "@/lib/api/types";
import { formatDay } from "@/lib/format-day";

/**
 * A job's tasks on its page (v0.3 design): adding one already linked to the job, the open ones by day, and the done
 * ones collapsed. Each line leaves out the job, which is this page.
 */
export async function JobTasks({
  jobId,
  tasks,
  jobs,
  locale,
}: {
  jobId: string;
  tasks: Task[];
  jobs: JobOption[];
  locale: string;
}) {
  const t = await getTranslations("JobDetail.tasks");
  const open = tasks.filter((task) => !task.doneAt);
  const done = tasks.filter((task) => task.doneAt);
  const line = (task: Task) => (
    <TaskLine
      key={task.id}
      task={task}
      jobs={jobs}
      day={task.dueOn && formatDay(task.dueOn, locale)}
      showJob={false}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <QuickAddTask jobs={jobs} jobId={jobId} />
      {open.length > 0 ? (
        <ul className="divide-y rounded-lg border">{open.map(line)}</ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
      {done.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 pb-2 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
            {t("done", { count: done.length })}
          </summary>
          <ul className="divide-y rounded-lg border">{done.map(line)}</ul>
        </details>
      )}
    </div>
  );
}
