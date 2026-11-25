import { describe, expect, it } from "vitest";
import type { ContactFollowUp, FollowUp, Task } from "./api/types";
import { addDays, groupToday, localDay, type TodayItem } from "./today";

// Monday 23 November 2026, as the browser would see it.
const TODAY = "2026-11-23";

function task(id: string, fields: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    notes: null,
    dueOn: null,
    job: null,
    doneAt: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...fields,
  };
}

function followUp(id: string, on: string): FollowUp {
  return { job: { id, company: id, title: "Engineer", status: "applied" }, on, note: null };
}

function contactFollowUp(id: string, on: string): ContactFollowUp {
  return { contact: { id, name: id, company: null }, on, note: null };
}

const ids = (items: TodayItem[]) =>
  items.map((item) =>
    item.kind === "task" ? item.task.id : item.kind === "followUp" ? item.followUp.job.id : item.followUp.contact.id,
  );

describe("localDay and addDays", () => {
  it("reads the day in the browser's time zone, and moves across months and years", () => {
    // Local times, in the time zone the tests run in.
    expect(localDay(new Date(2026, 10, 23, 0, 0))).toBe("2026-11-23");
    expect(localDay(new Date(2026, 10, 23, 23, 59))).toBe("2026-11-23");
    expect(addDays("2026-11-23", 7)).toBe("2026-11-30");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("groupToday", () => {
  it("is empty without tasks or follow-ups", () => {
    expect(groupToday({ tasks: [], followUps: [], contactFollowUps: [] }, TODAY)).toEqual({
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      noDate: [],
      doneToday: [],
    });
  });

  it("puts each open item in its section by day", () => {
    const sections = groupToday(
      {
        tasks: [
          task("yesterday", { dueOn: "2026-11-22" }),
          task("today", { dueOn: "2026-11-23" }),
          task("tomorrow", { dueOn: "2026-11-24" }),
          task("in a week", { dueOn: "2026-11-30" }),
          task("in eight days", { dueOn: "2026-12-01" }),
          task("someday"),
        ],
        followUps: [followUp("last month", "2026-10-15"), followUp("acme", "2026-11-23")],
        contactFollowUps: [contactFollowUp("margaret", "2026-11-23"), contactFollowUp("barbara", "2027-01-10")],
      },
      TODAY,
    );
    expect(ids(sections.overdue)).toEqual(["last month", "yesterday"]);
    expect(ids(sections.today)).toEqual(["acme", "margaret", "today"]);
    expect(ids(sections.upcoming)).toEqual(["tomorrow", "in a week"]);
    expect(ids(sections.later)).toEqual(["in eight days", "barbara"]);
    expect(ids(sections.noDate)).toEqual(["someday"]);
  });

  it("sorts by day; on the same day, jobs' follow-ups, then contacts', then tasks", () => {
    const sections = groupToday(
      {
        tasks: [task("late task", { dueOn: "2026-11-20" }), task("later task", { dueOn: "2026-11-21" })],
        followUps: [followUp("late follow-up", "2026-11-21"), followUp("oldest", "2026-11-01")],
        contactFollowUps: [
          contactFollowUp("later contact", "2026-11-21"),
          contactFollowUp("late contact", "2026-11-20"),
        ],
      },
      TODAY,
    );
    expect(ids(sections.overdue)).toEqual([
      "oldest",
      "late contact",
      "late task",
      "late follow-up",
      "later contact",
      "later task",
    ]);
  });

  it("shows only the tasks done today, the latest first, and never as open", () => {
    const at = (hour: number, day = 23) => new Date(2026, 10, day, hour).toISOString();
    const sections = groupToday(
      {
        tasks: [
          task("this morning", { dueOn: "2026-11-23", doneAt: at(8) }),
          task("just now", { doneAt: at(9) }),
          task("yesterday night", { dueOn: "2026-11-22", doneAt: at(23, 22) }),
        ],
        followUps: [],
        contactFollowUps: [],
      },
      TODAY,
    );
    expect(sections.doneToday.map((done) => done.id)).toEqual(["just now", "this morning"]);
    expect([...sections.overdue, ...sections.today, ...sections.noDate]).toEqual([]);
  });
});
