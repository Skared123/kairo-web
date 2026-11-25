import { browserApi } from "@/lib/api/browser";
import type { ContactFollowUp, FollowUp } from "@/lib/api/types";

/**
 * What a follow-up in Today belongs to: a job (API decision 034) or a contact (decision 037). Both keep it in the
 * same two fields, so Done and Postpone work the same way on either.
 */
export type FollowUpTarget = {
  type: "job" | "contact";
  id: string;
  /** How it reads, such as "Acme Robotics · Senior Engineer" or "Margaret Hamilton · Acme Robotics". */
  label: string;
  href: string;
  on: string;
  note: string | null;
};

export function jobTarget({ job, on, note }: FollowUp): FollowUpTarget {
  return { type: "job", id: job.id, label: `${job.company} · ${job.title}`, href: `/jobs/${job.id}`, on, note };
}

export function contactTarget({ contact, on, note }: ContactFollowUp): FollowUpTarget {
  const label = contact.company ? `${contact.name} · ${contact.company}` : contact.name;
  return { type: "contact", id: contact.id, label, href: `/contacts/${contact.id}`, on, note };
}

/** Saves the follow-up's new day (null clears it) on its job or contact, through the same PATCH the forms use. */
export function saveFollowUp(target: FollowUpTarget, body: { nextFollowUpOn: string | null; nextFollowUpNote?: null }) {
  const params = { path: { id: target.id } };
  return target.type === "job"
    ? browserApi.PATCH("/jobs/{id}", { params, body })
    : browserApi.PATCH("/contacts/{id}", { params, body });
}
