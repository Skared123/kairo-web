"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SelectField, TextareaField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { LEARNING_KINDS, LEARNING_STATUSES } from "@/lib/api/types";
import {
  learningFormSchema,
  toLearningPayload,
  type LearningFormValues,
  type LearningPayload,
} from "@/lib/forms/learning-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";
import { SkillsInput } from "./skills-input";

/**
 * The learning item form, for creating and for editing. `onSave` sends the payload to the API and answers an error
 * message to show, or nothing when it saved.
 */
export function LearningForm({
  defaultValues,
  skillNames,
  submitLabel,
  onSave,
}: {
  defaultValues: LearningFormValues;
  /** The user's skills, offered as suggestions. */
  skillNames: string[];
  submitLabel: string;
  onSave: (payload: LearningPayload) => Promise<string | void>;
}) {
  const t = useTranslations("LearningForm");
  const kindLabel = useTranslations("LearningKind");
  const statusLabel = useTranslations("LearningStatus");
  const messages = useValidationMessages();
  const skillsId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LearningFormValues>({ resolver: zodResolver(learningFormSchema(messages)), defaultValues });

  async function onSubmit(values: LearningFormValues) {
    setFormError(null);
    setFormError((await onSave(toLearningPayload(values))) ?? null);
  }

  const kinds = LEARNING_KINDS.map((value) => ({ value, label: kindLabel(value) }));
  const statuses = LEARNING_STATUSES.map((value) => ({ value, label: statusLabel(value) }));
  const field = (name: keyof LearningFormValues) => ({ control: form.control, name, label: t(`fields.${name}`) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>{t("sections.item")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField {...field("title")} autoComplete="off" placeholder={t("placeholders.title")} />
          </div>
          <SelectField {...field("kind")} options={kinds} noneLabel={t("none")} />
          <TextField {...field("url")} type="url" placeholder="https://" />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.skills")}</FieldLegend>
        <Controller
          control={form.control}
          name="skills"
          render={({ field: skills, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={skillsId}>{t("fields.skills")}</FieldLabel>
              <SkillsInput
                id={skillsId}
                value={skills.value}
                onChange={skills.onChange}
                onBlur={skills.onBlur}
                suggestions={skillNames}
                invalid={fieldState.invalid}
              />
              <FieldDescription>{t("skills.hint")}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.progress")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          {/* Every item has a status: no empty choice. */}
          <SelectField {...field("status")} options={statuses} />
          <div className="sm:col-span-2">
            <TextareaField {...field("notes")} rows={3} placeholder={t("placeholders.notes")} />
          </div>
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
