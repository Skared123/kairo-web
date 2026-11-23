"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { JOB_STATUSES, type JobStatus } from "@/lib/api/types";

/** Moves the job to another stage; the API records the move in its history (decision 028). */
export function StageSelect({ jobId, status }: { jobId: string; status: JobStatus }) {
  const t = useTranslations("JobDetail");
  const stages = useTranslations("JobStatus");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(next: string) {
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.POST("/jobs/{id}/status", {
        params: { path: { id: jobId } },
        body: { status: next as JobStatus },
      });
      if (!response.ok) {
        setError(validation("unexpected"));
        return;
      }
      router.refresh();
    } catch {
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {t("stage")}
      </label>
      <Select value={status} onValueChange={move} disabled={pending}>
        <SelectTrigger id={id} className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JOB_STATUSES.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stages(stage)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
