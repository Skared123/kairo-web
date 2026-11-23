"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SelectField, TextareaField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  CONTRACT_TYPES,
  JOB_SOURCES,
  jobFormSchema,
  SALARY_PERIODS,
  toJobPayload,
  WORK_MODES,
  type JobFormValues,
  type JobPayload,
} from "@/lib/forms/job-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

/**
 * The job form, for capturing and for editing. `onSave` sends the payload to the API and answers an error message
 * to show, or nothing when it saved.
 */
export function JobForm({
  defaultValues,
  submitLabel,
  onSave,
}: {
  defaultValues: JobFormValues;
  submitLabel: string;
  onSave: (payload: JobPayload) => Promise<string | void>;
}) {
  const t = useTranslations("JobForm");
  const messages = useValidationMessages();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<JobFormValues>({ resolver: zodResolver(jobFormSchema(messages)), defaultValues });

  async function onSubmit(values: JobFormValues) {
    setFormError(null);
    setFormError((await onSave(toJobPayload(values))) ?? null);
  }

  // One line per list, so every option's translation key is checked.
  const sources = JOB_SOURCES.map((value) => ({ value, label: t(`options.source.${value}`) }));
  const workModes = WORK_MODES.map((value) => ({ value, label: t(`options.workMode.${value}`) }));
  const contractTypes = CONTRACT_TYPES.map((value) => ({ value, label: t(`options.contractType.${value}`) }));
  const periods = SALARY_PERIODS.map((value) => ({ value, label: t(`options.period.${value}`) }));
  const field = (name: keyof JobFormValues) => ({ control: form.control, name, label: t(`fields.${name}`) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>{t("sections.posting")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <TextField {...field("company")} autoComplete="organization" />
          <TextField {...field("title")} autoComplete="organization-title" />
          <TextField {...field("url")} type="url" placeholder="https://" />
          <SelectField {...field("source")} options={sources} noneLabel={t("none")} />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.conditions")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <SelectField {...field("workMode")} options={workModes} noneLabel={t("none")} />
          <TextField {...field("location")} />
          <SelectField {...field("contractType")} options={contractTypes} noneLabel={t("none")} />
          <TextField {...field("timeZoneNotes")} placeholder={t("placeholders.timeZoneNotes")} />
          <TextField {...field("salaryMin")} inputMode="numeric" />
          <TextField {...field("salaryMax")} inputMode="numeric" />
          <TextField {...field("salaryCurrency")} maxLength={3} placeholder="MXN, USD…" className="uppercase" />
          <SelectField {...field("salaryPeriod")} options={periods} noneLabel={t("none")} />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.details")}</FieldLegend>
        <FieldGroup>
          <TextareaField
            {...field("description")}
            rows={10}
            description={t("placeholders.description")}
          />
          <TextareaField {...field("notes")} rows={3} />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.followUp")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <TextField {...field("nextFollowUpOn")} type="date" />
          <TextField {...field("nextFollowUpNote")} placeholder={t("placeholders.nextFollowUpNote")} />
        </FieldGroup>
      </FieldSet>

      {formError && <FieldError>{formError}</FieldError>}
      <div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
