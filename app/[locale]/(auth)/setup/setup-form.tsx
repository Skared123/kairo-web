"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { setupSchema, type SetupValues } from "@/lib/forms/auth-schemas";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

export function SetupForm() {
  const t = useTranslations("Setup");
  const fields = useTranslations("Fields");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema(messages)),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SetupValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.POST("/auth/setup", { body: values });
      if (response.ok) {
        // The API created the admin and signed them in.
        router.push("/");
        router.refresh();
        return;
      }
      if (response.status === 409) {
        // Someone finished the setup first: there is an admin now, so sign in.
        setFormError(t("alreadyDone"));
        router.replace("/sign-in");
        return;
      }
      setFormError(validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="name" label={fields("name")} autoComplete="name" />
        <TextField control={form.control} name="email" label={fields("email")} type="email" autoComplete="email" />
        <TextField
          control={form.control}
          name="password"
          label={fields("password")}
          type="password"
          autoComplete="new-password"
        />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
