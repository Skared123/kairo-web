"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { JobForm } from "@/components/job-form";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { paths } from "@/lib/api/schema";
import { EMPTY_JOB_FORM, type JobPayload } from "@/lib/forms/job-schema";

type Created = paths["/jobs"]["post"]["responses"][201]["content"]["application/json"];

/** Captures a job; when the API finds similar ones (decision 031), shows them before moving on. */
export function CreateJob() {
  const t = useTranslations("JobForm");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [created, setCreated] = useState<Created | null>(null);

  async function save(payload: JobPayload): Promise<string | void> {
    try {
      const { data } = await browserApi.POST("/jobs", { body: payload });
      if (!data) {
        return validation("unexpected");
      }
      if (data.possibleDuplicates.length > 0) {
        setCreated(data);
        return;
      }
      router.push("/jobs");
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  if (created) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <p className="flex items-center gap-2 font-medium">
          <TriangleAlert className="size-4" aria-hidden />
          {t("duplicates.title", { company: created.company, title: created.title })}
        </p>
        <p className="text-sm text-muted-foreground">{t("duplicates.description")}</p>
        <ul className="flex flex-col gap-2">
          {created.possibleDuplicates.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{job.company}</span>
              <span>·</span>
              <span>{job.title}</span>
              <JobStatusBadge status={job.status} />
              {job.url && (
                <a href={job.url} target="_blank" rel="noreferrer" className="text-muted-foreground underline">
                  {t("duplicates.link")}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div>
          <Button asChild>
            <Link href="/jobs">{t("duplicates.continue")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <JobForm defaultValues={EMPTY_JOB_FORM} submitLabel={t("create")} onSave={save} />;
}
