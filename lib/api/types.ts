import type { paths } from "./schema";

/** The signed-in user, as `GET /auth/me` returns it. */
export type CurrentUser = paths["/auth/me"]["get"]["responses"][200]["content"]["application/json"];

/** An account as the admin sees it, as `GET /admin/users` returns it. */
export type Account = paths["/admin/users"]["get"]["responses"][200]["content"]["application/json"][number];

/** A job as `GET /jobs` returns it, with how it compares with the user's criteria. */
export type Job = paths["/jobs"]["get"]["responses"][200]["content"]["application/json"][number];
export type JobStatus = Job["status"];
export type JobSort = NonNullable<NonNullable<paths["/jobs"]["get"]["parameters"]["query"]>["sort"]>;

/** One move between stages, as `GET /jobs/{id}/history` returns it (API decision 028). */
export type StageChange = paths["/jobs/{id}/history"]["get"]["responses"][200]["content"]["application/json"][number];

/** Every stage, in the order a job usually moves through them (API decision 028). */
export const JOB_STATUSES = [
  "to_review",
  "to_apply",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
  "discarded",
] as const satisfies readonly JobStatus[];

/** A task as the API returns it, with its job's company and title when it has one (API decision 033). */
export type Task = paths["/tasks"]["get"]["responses"][200]["content"]["application/json"][number];

/** Everything Today shows, as `GET /today` returns it: not filtered by day (API decision 035). */
export type Today = paths["/today"]["get"]["responses"][200]["content"]["application/json"];
export type FollowUp = Today["followUps"][number];

/** A contact as the API returns it, with its jobs and the day of its latest conversation (API decisions 036 to 038). */
export type Contact = paths["/contacts"]["get"]["responses"][200]["content"]["application/json"][number];
export type ContactKind = NonNullable<Contact["kind"]>;

/** How a contact relates to the search, in the order the form lists them. */
export const CONTACT_KINDS = [
  "recruiter",
  "hiring_manager",
  "interviewer",
  "referral",
  "employee",
  "other",
] as const satisfies readonly ContactKind[];

/** One conversation with a contact, as `GET /contacts/{contactId}/interactions` returns it (API decision 038). */
export type Interaction =
  paths["/contacts/{contactId}/interactions"]["get"]["responses"][200]["content"]["application/json"][number];
export type InteractionChannel = Interaction["channel"];

export const INTERACTION_CHANNELS = [
  "email",
  "linkedin",
  "call",
  "meeting",
  "other",
] as const satisfies readonly InteractionChannel[];
