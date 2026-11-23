"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SelectField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import {
  criteriaFormSchema,
  fromCriteria,
  toCriteriaPayload,
  type Criteria,
  type CriteriaFormValues,
} from "@/lib/forms/criteria-schema";
import { CONTRACT_TYPES, SALARY_PERIODS } from "@/lib/forms/job-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

/** What the user looks for. Every job is compared with it (API decision 029). */
export function CriteriaForm({ criteria }: { criteria: Criteria }) {
  const t = useTranslations("Criteria");
  const form = useTranslations("JobForm");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const remoteId = useId();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<CriteriaFormValues>({
    resolver: zodResolver(criteriaFormSchema(messages)),
    defaultValues: fromCriteria(criteria),
  });

  async function onSubmit(values: CriteriaFormValues) {
    setSaved(false);
    setFormError(null);
    try {
      const { response } = await browserApi.PUT("/criteria", { body: toCriteriaPayload(values) });
      if (!response.ok) {
        setFormError(validation("unexpected"));
        return;
      }
      setSaved(true);
      // Every job's match depends on the criteria.
      router.refresh();
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  const periods = SALARY_PERIODS.map((value) => ({ value, label: form(`options.period.${value}`) }));

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} onChange={() => setSaved(false)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>{t("salary.title")}</FieldLegend>
        <FieldDescription>{t("salary.description")}</FieldDescription>
        <FieldGroup className="grid gap-4 sm:grid-cols-3">
          <TextField control={methods.control} name="minSalary" label={t("salary.minSalary")} inputMode="numeric" />
          <TextField
            control={methods.control}
            name="currency"
            label={form("fields.salaryCurrency")}
            maxLength={3}
            placeholder="MXN, USD…"
            className="uppercase"
          />
          <SelectField
            control={methods.control}
            name="period"
            label={form("fields.salaryPeriod")}
            options={periods}
            noneLabel={form("none")}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("workMode.title")}</FieldLegend>
        <Controller
          control={methods.control}
          name="remoteOnly"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox id={remoteId} checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
              <Label htmlFor={remoteId}>{t("workMode.remoteOnly")}</Label>
            </div>
          )}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("contract.title")}</FieldLegend>
        <FieldDescription>{t("contract.description")}</FieldDescription>
        <Controller
          control={methods.control}
          name="contractTypes"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {CONTRACT_TYPES.map((type) => (
                <ContractCheckbox
                  key={type}
                  label={form(`options.contractType.${type}`)}
                  checked={field.value.includes(type)}
                  onChange={(checked) =>
                    field.onChange(checked ? [...field.value, type] : field.value.filter((value) => value !== type))
                  }
                />
              ))}
            </div>
          )}
        />
      </FieldSet>

      {formError && <FieldError>{formError}</FieldError>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={methods.formState.isSubmitting}>
          {methods.formState.isSubmitting ? form("saving") : t("save")}
        </Button>
        {saved && (
          <span role="status" className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="size-4" aria-hidden />
            {t("saved")}
          </span>
        )}
      </div>
    </form>
  );
}

function ContractCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
