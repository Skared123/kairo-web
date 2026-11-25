import type { FollowUp, Task, Today } from "./api/types";

/** One line in Today: a task or a job's follow-up, with the day it is due (null for a task without one). */
export type TodayItem =
  | { kind: "task"; day: string | null; task: Task }
  | { kind: "followUp"; day: string; followUp: FollowUp };

export type TodaySections = {
  overdue: TodayItem[];
  today: TodayItem[];
  /** The next seven days, after today. */
  upcoming: TodayItem[];
  /** Further ahead; Today shows it collapsed, so a task far ahead never seems lost. */
  later: TodayItem[];
  /** Open tasks without a day. */
  noDate: TodayItem[];
  /** Tasks done today, the latest first. */
  doneToday: Task[];
};

/** How many days after today "upcoming" covers (API decision 034). */
export const UPCOMING_DAYS = 7;

/** The calendar day of `date` in the browser's time zone, as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The calendar day `days` after `day` (both YYYY-MM-DD). Days have no time zone, so the math runs in UTC. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Sorts what `GET /today` answered into Today's sections, for the browser's `today` (YYYY-MM-DD, API decision 035).
 * Within a section, items go by day, a job's follow-up before a task on the same day; otherwise in the API's order.
 */
export function groupToday({ tasks, followUps }: Pick<Today, "tasks" | "followUps">, today: string): TodaySections {
  const lastUpcoming = addDays(today, UPCOMING_DAYS);
  const sections: TodaySections = { overdue: [], today: [], upcoming: [], later: [], noDate: [], doneToday: [] };

  const items: TodayItem[] = [
    ...followUps.map((followUp): TodayItem => ({ kind: "followUp", day: followUp.on, followUp })),
    ...tasks.filter((task) => !task.doneAt).map((task): TodayItem => ({ kind: "task", day: task.dueOn, task })),
  ];
  // A stable sort: same-day items keep the order above, follow-ups first.
  items.sort((a, b) => (a.day ?? "").localeCompare(b.day ?? ""));

  for (const item of items) {
    if (item.day === null) {
      sections.noDate.push(item);
    } else if (item.day < today) {
      sections.overdue.push(item);
    } else if (item.day === today) {
      sections.today.push(item);
    } else if (item.day <= lastUpcoming) {
      sections.upcoming.push(item);
    } else {
      sections.later.push(item);
    }
  }

  sections.doneToday = tasks
    .filter((task) => task.doneAt && localDay(new Date(task.doneAt)) === today)
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!));
  return sections;
}
