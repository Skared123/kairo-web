"use client";

import { ChevronRight, Reply } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useSyncExternalStore, type ReactNode } from "react";
import { JobLink, Meta } from "@/components/tasks/item-parts";
import type { JobOption } from "@/components/tasks/job-option";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskLine } from "@/components/tasks/task-line";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Task, Today } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { groupToday, localDay, type TodayItem } from "@/lib/today";

const subscribe = () => () => {};

/**
 * Today's sections, sorted with the browser's own day (API decision 035). Rendered only in the browser: the server
 * does not know the user's day.
 */
export function TodayView({ data, jobs }: { data: Today; jobs: JobOption[] }) {
  const t = useTranslations("Today");
  const locale = useLocale();
  const today = useSyncExternalStore(subscribe, () => localDay(new Date()), () => null);
  if (!today) {
    return null;
  }
  const sections = groupToday(data, today);
  const dayLabel = (day: string) => formatShortDay(day, locale);
  const nothingOpen =
    sections.overdue.length + sections.today.length + sections.upcoming.length + sections.later.length +
      sections.noDate.length ===
    0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium first-letter:uppercase">{formatLongDay(today, locale)}</p>
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

      <Section title={t("sections.overdue")} items={sections.overdue} jobs={jobs} danger dayLabel={dayLabel} />
      <Section title={t("sections.today")} items={sections.today} jobs={jobs} />
      <Section title={t("sections.upcoming")} items={sections.upcoming} jobs={jobs} dayLabel={dayLabel} />
      <Section title={t("sections.noDate")} items={sections.noDate} jobs={jobs} />
      <Section title={t("sections.later")} items={sections.later} jobs={jobs} dayLabel={dayLabel} collapsed />
      <DoneToday tasks={sections.doneToday} jobs={jobs} />
    </div>
  );
}

/** One section with its count; left out when empty. A collapsed one opens on a click. */
function Section({
  title,
  items,
  jobs,
  danger,
  collapsed,
  dayLabel,
}: {
  title: string;
  items: TodayItem[];
  jobs: JobOption[];
  danger?: boolean;
  collapsed?: boolean;
  /** How each item shows its day; without it, the section's title says it all (Today, No date). */
  dayLabel?: (day: string) => string;
}) {
  if (items.length === 0) {
    return null;
  }
  const list = (
    <ul className="divide-y rounded-lg border">
      {items.map((item) =>
        item.kind === "task" ? (
          <TaskLine key={item.task.id} task={item.task} jobs={jobs} day={item.day && dayLabel?.(item.day)} />
        ) : (
          <FollowUpLine key={`follow-up-${item.followUp.job.id}`} item={item} day={dayLabel?.(item.day)} />
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

function FollowUpLine({ item, day }: { item: Extract<TodayItem, { kind: "followUp" }>; day?: string }) {
  const t = useTranslations("Today");
  const { followUp } = item;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Reply className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm">
          {t("followUp")}: <JobLink job={followUp.job} />
        </span>
        <Meta>
          {followUp.note}
          {day}
        </Meta>
      </div>
    </li>
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
