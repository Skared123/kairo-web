"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { EMPTY_TASK_FORM, taskFormSchema, toTaskPayload, type TaskFormValues } from "@/lib/forms/task-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";
import type { JobOption } from "./job-option";

// Radix Select items cannot have an empty value, so "no job" travels as this placeholder.
const NO_JOB = "__none__";

/** One line to add a task: a title, and optionally a day and a job. Stays ready for the next one. */
export function QuickAddTask({ jobs, jobId }: { jobs: JobOption[]; jobId?: string }) {
  const t = useTranslations("Tasks");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const defaults = { ...EMPTY_TASK_FORM, jobId: jobId ?? "" };
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema(messages)), defaultValues: defaults });

  async function onSubmit(values: TaskFormValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.POST("/tasks", { body: toTaskPayload(values) });
      if (response.ok) {
        // Ready for the next one: cleared, with the cursor back in the title.
        form.reset(defaults);
        requestAnimationFrame(() => document.getElementById(`${id}-title`)?.focus());
        router.refresh();
        return;
      }
      setFormError(response.status === 400 && values.jobId ? t("jobNotFound") : validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  const titleError = form.formState.errors.title?.message;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`${id}-title`} className="sr-only">
          {t("fields.title")}
        </label>
        <Input
          {...form.register("title")}
          id={`${id}-title`}
          placeholder={t("add.placeholder")}
          aria-invalid={!!titleError}
          autoComplete="off"
          className="min-w-48 flex-1"
        />
        <label htmlFor={`${id}-due`} className="sr-only">
          {t("fields.dueOn")}
        </label>
        <Input {...form.register("dueOn")} id={`${id}-due`} type="date" className="w-40" />
        {!jobId && (
          <Controller
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <Select value={field.value || NO_JOB} onValueChange={(value) => field.onChange(value === NO_JOB ? "" : value)}>
                <SelectTrigger aria-label={t("fields.job")} className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_JOB}>{t("fields.noJob")}</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Plus aria-hidden />
          {form.formState.isSubmitting ? t("add.adding") : t("add.submit")}
        </Button>
      </div>
      {titleError && <FieldError>{titleError}</FieldError>}
      {formError && <FieldError>{formError}</FieldError>}
    </form>
  );
}
