"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SelectField, TextareaField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Task } from "@/lib/api/types";
import { fromTask, taskFormSchema, toTaskPayload, type TaskFormValues } from "@/lib/forms/task-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";
import type { JobOption } from "./job-option";

/** Edits a task in a dialog: its title, day, job and notes. */
export function EditTaskDialog({ task, jobs }: { task: Task; jobs: JobOption[] }) {
  const t = useTranslations("Tasks");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema(messages)), defaultValues: fromTask(task) });

  // The task's own job stays selectable even if it is not among the options (it always is today, but cheap to keep).
  const options = [
    ...jobs.map((job) => ({ value: job.id, label: job.label })),
    ...(task.job && !jobs.some((job) => job.id === task.job!.id)
      ? [{ value: task.job.id, label: `${task.job.company} · ${task.job.title}` }]
      : []),
  ];

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(fromTask(task));
      setFormError(null);
    }
  }

  async function onSubmit(values: TaskFormValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.PATCH("/tasks/{id}", {
        params: { path: { id: task.id } },
        body: toTaskPayload(values),
      });
      if (response.ok) {
        setOpen(false);
        router.refresh();
        return;
      }
      if (response.status === 400 && values.jobId) {
        form.setError("jobId", { message: t("jobNotFound") });
        return;
      }
      setFormError(validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("edit.button", { title: task.title })}>
          <Pencil aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{t("edit.title")}</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <TextField control={form.control} name="title" label={t("fields.title")} autoComplete="off" />
            <TextField control={form.control} name="dueOn" label={t("fields.dueOn")} type="date" />
            <SelectField
              control={form.control}
              name="jobId"
              label={t("fields.job")}
              options={options}
              noneLabel={t("fields.noJob")}
            />
            <TextareaField control={form.control} name="notes" label={t("fields.notes")} rows={3} />
            {formError && <FieldError>{formError}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("edit.saving") : t("edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
