"use client";

import { useId, type ComponentProps } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BaseProps<T extends FieldValues> = { control: Control<T>; name: FieldPath<T>; label: string; description?: string };

/** A labelled textarea wired to React Hook Form (shadcn/ui's Field pattern, like TextField). */
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...textarea
}: BaseProps<T> & Omit<ComponentProps<typeof Textarea>, "name" | "id">) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Textarea {...textarea} {...field} id={id} aria-invalid={fieldState.invalid} />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

// Radix Select items cannot have an empty value, so "no choice" travels as this placeholder and becomes "".
const NONE = "__none__";

/** A labelled select wired to React Hook Form; with `noneLabel`, a "none" option that clears it. */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  noneLabel,
}: BaseProps<T> & { options: readonly { value: string; label: string }[]; noneLabel?: string }) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select value={field.value || NONE} onValueChange={(value) => field.onChange(value === NONE ? "" : value)}>
            <SelectTrigger id={id} aria-invalid={fieldState.invalid} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
