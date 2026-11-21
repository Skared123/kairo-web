"use client";

import { useId, type ComponentProps } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
} & Omit<ComponentProps<typeof Input>, "name" | "id">;

/** A labelled input wired to React Hook Form, showing its error under it (shadcn/ui's Field pattern). */
export function TextField<T extends FieldValues>({ control, name, label, ...input }: TextFieldProps<T>) {
  // Unique per instance: Next.js keeps previous pages mounted but hidden, so a fixed id could repeat.
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input {...input} {...field} id={id} aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
