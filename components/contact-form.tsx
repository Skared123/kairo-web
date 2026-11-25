"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SelectField, TextareaField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { CONTACT_KINDS } from "@/lib/api/types";
import {
  contactFormSchema,
  toContactPayload,
  type ContactFormValues,
  type ContactPayload,
} from "@/lib/forms/contact-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

/**
 * The contact form, for creating and for editing. `onSave` sends the payload to the API and answers an error message
 * to show, or nothing when it saved.
 */
export function ContactForm({
  defaultValues,
  submitLabel,
  onSave,
}: {
  defaultValues: ContactFormValues;
  submitLabel: string;
  onSave: (payload: ContactPayload) => Promise<string | void>;
}) {
  const t = useTranslations("ContactForm");
  const kindLabel = useTranslations("ContactKind");
  const messages = useValidationMessages();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema(messages)), defaultValues });

  async function onSubmit(values: ContactFormValues) {
    setFormError(null);
    setFormError((await onSave(toContactPayload(values))) ?? null);
  }

  const kinds = CONTACT_KINDS.map((value) => ({ value, label: kindLabel(value) }));
  const field = (name: keyof ContactFormValues) => ({ control: form.control, name, label: t(`fields.${name}`) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>{t("sections.person")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <TextField {...field("name")} autoComplete="off" />
          <TextField {...field("company")} autoComplete="off" />
          <TextField {...field("role")} autoComplete="off" placeholder={t("placeholders.role")} />
          <SelectField {...field("kind")} options={kinds} noneLabel={t("none")} />
          <div className="sm:col-span-2">
            <TextareaField {...field("notes")} rows={3} placeholder={t("placeholders.notes")} />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.reach")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <TextField {...field("email")} type="email" autoComplete="off" />
          <TextField {...field("phone")} type="tel" autoComplete="off" />
          <TextField {...field("linkedinUrl")} type="url" placeholder="https://www.linkedin.com/in/…" />
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
