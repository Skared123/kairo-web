"use client";

import { Link2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { JobStatusBadge } from "@/components/job-status-badge";
import type { JobOption } from "@/components/tasks/job-option";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Contact } from "@/lib/api/types";

/** A contact's jobs (API decision 036): each links to its page and can be unlinked; another one can be linked. */
export function ContactJobs({
  contactId,
  jobs,
  options,
}: {
  contactId: string;
  jobs: Contact["jobs"];
  options: JobOption[];
}) {
  const t = useTranslations("ContactDetail.jobs");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkable = options.filter((option) => !jobs.some((job) => job.id === option.id));

  async function change(method: "PUT" | "DELETE", jobId: string) {
    setPending(true);
    setError(null);
    try {
      const params = { path: { id: contactId, jobId } };
      const { response } =
        method === "PUT"
          ? await browserApi.PUT("/contacts/{id}/jobs/{jobId}", { params })
          : await browserApi.DELETE("/contacts/{id}/jobs/{jobId}", { params });
      // 404: the job or the contact was deleted meanwhile; the refresh shows what is left.
      if (response.ok || response.status === 404) {
        setChoice("");
        router.refresh();
        return;
      }
      setError(validation("unexpected"));
    } catch {
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => {
            const label = `${job.company} · ${job.title}`;
            return (
              <li key={job.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex min-w-0 flex-col items-start gap-1">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">
                    {label}
                  </Link>
                  <JobStatusBadge status={job.status} />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => change("DELETE", job.id)}
                  aria-label={t("unlink", { job: label })}
                  className="-my-1 shrink-0"
                >
                  <X aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      )}
      {linkable.length > 0 && (
        <div className="flex gap-2">
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger aria-label={t("choose")} className="min-w-0 flex-1">
              <SelectValue placeholder={t("choose")} />
            </SelectTrigger>
            <SelectContent>
              {linkable.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={!choice || pending} onClick={() => change("PUT", choice)}>
            <Link2 aria-hidden />
            {t("link")}
          </Button>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
