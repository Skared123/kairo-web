"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { FollowUpLine } from "@/components/follow-ups/follow-up-line";
import { contactTarget, jobTarget } from "@/components/follow-ups/follow-up-target";
import { FocusCard } from "@/components/learning/focus-card";
import type { JobOption } from "@/components/tasks/job-option";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskLine } from "@/components/tasks/task-line";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Task, Today } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { groupToday, type TodayItem } from "@/lib/today";
import { useBrowserDay } from "@/lib/use-browser-day";

/**
 * Today's sections, sorted with the browser's own day (API decision 035). Rendered only in the browser: the server
 * does not know the user's day.
 */
export function TodayView({ data, jobs }: { data: Today; jobs: JobOption[] }) {
  const t = useTranslations("Today");
  const locale = useLocale();
  const today = useBrowserDay();
  if (!today) {
    return null;
  }
  const sections = groupToday(data, today);
  const context: SectionContext = { jobs, today, dayLabel: (day) => formatShortDay(day, locale) };
  const nothingOpen =
    sections.overdue.length + sections.today.length + sections.upcoming.length + sections.later.length +
      sections.noDate.length ===
    0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium first-letter:uppercase">{formatLongDay(today, locale)}</p>
      <FocusCard focus={data.focus} />
      <QuickAddTask jobs={jobs} />

      {nothingOpen && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">{t("empty.title")}</p>
          <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/jobs">{t("empty.jobs")}</Link>
          </Button>
        </div>
      )}

      <Section title={t("sections.overdue")} items={sections.overdue} context={context} danger showDay />
      <Section title={t("sections.today")} items={sections.today} context={context} />
      <Section title={t("sections.upcoming")} items={sections.upcoming} context={context} showDay />
      <Section title={t("sections.noDate")} items={sections.noDate} context={context} />
      <Section title={t("sections.later")} items={sections.later} context={context} showDay collapsed />
      <DoneToday tasks={sections.doneToday} jobs={jobs} />
    </div>
  );
}

/** What every line needs: the job options for tasks, the browser's day and how a day reads. */
type SectionContext = { jobs: JobOption[]; today: string; dayLabel: (day: string) => string };

/** One section with its count; left out when empty. A collapsed one opens on a click. */
function Section({
  title,
  items,
  context: { jobs, today, dayLabel },
  danger,
  collapsed,
  showDay,
}: {
  title: string;
  items: TodayItem[];
  context: SectionContext;
  danger?: boolean;
  collapsed?: boolean;
  /** Whether each item shows its day; not where the section's title says it all (Today, No date). */
  showDay?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }
  const list = (
    <ul className="divide-y rounded-lg border">
      {items.map((item) =>
        item.kind === "task" ? (
          <TaskLine
            key={item.task.id}
            task={item.task}
            jobs={jobs}
            day={showDay && item.day ? dayLabel(item.day) : null}
          />
        ) : (
          <FollowUpLine
            key={item.kind === "followUp" ? `job-${item.followUp.job.id}` : `contact-${item.followUp.contact.id}`}
            target={item.kind === "followUp" ? jobTarget(item.followUp) : contactTarget(item.followUp)}
            day={showDay ? dayLabel(item.day) : undefined}
            today={today}
            dayLabel={dayLabel}
          />
        ),
      )}
    </ul>
  );
  return (
    <SectionFrame title={title} count={items.length} danger={danger} collapsed={collapsed}>
      {list}
    </SectionFrame>
  );
}

function DoneToday({ tasks, jobs }: { tasks: Task[]; jobs: JobOption[] }) {
  const t = useTranslations("Today");
  if (tasks.length === 0) {
    return null;
  }
  return (
    <SectionFrame title={t("sections.doneToday")} count={tasks.length} collapsed>
      <ul className="divide-y rounded-lg border">
        {tasks.map((task) => (
          <TaskLine key={task.id} task={task} jobs={jobs} />
        ))}
      </ul>
    </SectionFrame>
  );
}

/** A section named by its heading, so it reads as a region; collapsed ones use <details>. */
function SectionFrame({
  title,
  count,
  danger,
  collapsed,
  children,
}: {
  title: string;
  count: number;
  danger?: boolean;
  collapsed?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const heading = (
    <h2 id={id} className={cn("text-sm font-medium text-muted-foreground", danger && "text-destructive")}>
      {title} · {count}
    </h2>
  );
  if (collapsed) {
    return (
      <section aria-labelledby={id}>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 pb-2 [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
            {heading}
          </summary>
          {children}
        </details>
      </section>
    );
  }
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      {heading}
      {children}
    </section>
  );
}

/** "lunes, 23 de noviembre": the browser's day, in the page's language. Days are read in UTC (see formatDay). */
function formatLongDay(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}

/** "jue, 26 nov" for an item's day. */
function formatShortDay(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}
