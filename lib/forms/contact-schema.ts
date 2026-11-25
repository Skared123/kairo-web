import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import { CONTACT_KINDS, type Contact } from "@/lib/api/types";
import type { ValidationMessages } from "./auth-schemas";

export type ContactPayload = paths["/contacts"]["post"]["requestBody"]["content"]["application/json"];

/** The messages the contact form adds to the shared ones. */
export type ContactValidationMessages = ValidationMessages & { url: string };

// The same limits as the API's schema (kairo-api src/contacts/contacts.schemas.ts); the API still decides.
const optionalText = (m: ValidationMessages, max: number) => z.string().trim().max(max, m.tooLong(max));
// Checked only when the field is filled in, so an empty one is never "invalid".
const EMAIL = z.email();
const WEB_URL = z.url({ protocol: /^https?$/ });

/**
 * The contact form, field by field as the inputs hold them: text everywhere, "" for an empty field.
 * `toContactPayload()` turns the values into what the API takes.
 */
export function contactFormSchema(m: ContactValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, m.required).max(200, m.tooLong(200)),
    company: optionalText(m, 200),
    role: optionalText(m, 200),
    kind: z.union([z.enum(CONTACT_KINDS), z.literal("")]),
    email: optionalText(m, 320).refine((value) => value === "" || EMAIL.safeParse(value).success, m.email),
    phone: optionalText(m, 50),
    linkedinUrl: optionalText(m, 2000).refine((value) => value === "" || WEB_URL.safeParse(value).success, m.url),
    notes: optionalText(m, 5_000),
    nextFollowUpOn: z.union([z.literal(""), z.iso.date()]),
    nextFollowUpNote: optionalText(m, 500),
  });
}

export type ContactFormValues = z.input<ReturnType<typeof contactFormSchema>>;

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  name: "",
  company: "",
  role: "",
  kind: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  notes: "",
  nextFollowUpOn: "",
  nextFollowUpNote: "",
};

/** The API's contact as form values, for editing. */
export function fromContact(contact: Contact): ContactFormValues {
  const text = (value: string | null) => value ?? "";
  return {
    name: contact.name,
    company: text(contact.company),
    role: text(contact.role),
    kind: contact.kind ?? "",
    email: text(contact.email),
    phone: text(contact.phone),
    linkedinUrl: text(contact.linkedinUrl),
    notes: text(contact.notes),
    nextFollowUpOn: text(contact.nextFollowUpOn),
    nextFollowUpNote: text(contact.nextFollowUpNote),
  };
}

/** Valid form values as the API takes them: empty fields become null, so an edit can also clear them. */
export function toContactPayload(values: ContactFormValues): ContactPayload {
  const text = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    name: values.name.trim(),
    company: text(values.company),
    role: text(values.role),
    kind: values.kind || null,
    email: text(values.email),
    phone: text(values.phone),
    linkedinUrl: text(values.linkedinUrl),
    notes: text(values.notes),
    nextFollowUpOn: text(values.nextFollowUpOn),
    nextFollowUpNote: text(values.nextFollowUpNote),
  };
}
