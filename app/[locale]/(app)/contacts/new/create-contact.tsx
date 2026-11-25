"use client";

import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/contact-form";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { EMPTY_CONTACT_FORM, type ContactPayload } from "@/lib/forms/contact-schema";

/** Saves a new contact, then opens its page. */
export function CreateContact() {
  const t = useTranslations("ContactForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: ContactPayload): Promise<string | void> {
    try {
      const { data } = await browserApi.POST("/contacts", { body: payload });
      if (!data) {
        return validation("unexpected");
      }
      router.push(`/contacts/${data.id}`);
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  return <ContactForm defaultValues={EMPTY_CONTACT_FORM} submitLabel={t("create")} onSave={save} />;
}
