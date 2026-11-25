"use client";

import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/contact-form";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Contact } from "@/lib/api/types";
import { fromContact, type ContactPayload } from "@/lib/forms/contact-schema";

/** Edits a contact; every field is sent, so an emptied one is cleared. */
export function EditContact({ contact }: { contact: Contact }) {
  const t = useTranslations("ContactForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: ContactPayload): Promise<string | void> {
    try {
      const { response } = await browserApi.PATCH("/contacts/{id}", {
        params: { path: { id: contact.id } },
        body: payload,
      });
      if (response.status === 404) {
        return t("notFound");
      }
      if (!response.ok) {
        return validation("unexpected");
      }
      router.push("/contacts");
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  return <ContactForm defaultValues={fromContact(contact)} submitLabel={t("save")} onSave={save} />;
}
