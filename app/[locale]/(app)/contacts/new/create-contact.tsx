"use client";

import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/contact-form";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { EMPTY_CONTACT_FORM, type ContactPayload } from "@/lib/forms/contact-schema";

/**
 * Saves a new contact, then opens its page. From a job's page, the contact starts with the job's company, is linked to
 * that job on creation, and the user goes back to the job.
 */
export function CreateContact({ job }: { job?: { id: string; company: string; label: string } }) {
  const t = useTranslations("ContactForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: ContactPayload): Promise<string | void> {
    try {
      const { data, response } = await browserApi.POST("/contacts", {
        body: job ? { ...payload, jobIds: [job.id] } : payload,
      });
      if (!data) {
        // The job was deleted since the page opened.
        return response.status === 400 && job ? t("jobNotFound") : validation("unexpected");
      }
      router.push(job ? `/jobs/${job.id}` : `/contacts/${data.id}`);
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {job && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4" aria-hidden />
          {t("linkedTo", { job: job.label })}
        </p>
      )}
      <ContactForm
        defaultValues={job ? { ...EMPTY_CONTACT_FORM, company: job.company } : EMPTY_CONTACT_FORM}
        submitLabel={t("create")}
        onSave={save}
      />
    </div>
  );
}
