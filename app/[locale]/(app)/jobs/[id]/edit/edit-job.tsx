"use client";

import { useTranslations } from "next-intl";
import { JobForm } from "@/components/job-form";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Job } from "@/lib/api/types";
import { fromJob, type JobPayload } from "@/lib/forms/job-schema";

/** Edits a job; every field is sent, so an emptied one is cleared. The stage moves on the job's page (step 7). */
export function EditJob({ job }: { job: Job }) {
  const t = useTranslations("JobForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: JobPayload): Promise<string | void> {
    try {
      const { response } = await browserApi.PATCH("/jobs/{id}", { params: { path: { id: job.id } }, body: payload });
      if (response.status === 404) {
        return t("notFound");
      }
      if (!response.ok) {
        return validation("unexpected");
      }
      router.push("/jobs");
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  return <JobForm defaultValues={fromJob(job)} submitLabel={t("save")} onSave={save} />;
}
