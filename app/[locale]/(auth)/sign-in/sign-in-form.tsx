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
import { signInSchema, type SignInValues } from "@/lib/forms/auth-schemas";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

export function SignInForm() {
  const t = useTranslations("SignIn");
  const fields = useTranslations("Fields");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema(messages)),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.POST("/auth/sign-in", { body: values });
      if (response.ok) {
        // The API set the session cookie; refresh so Server Components read the new session.
        router.push("/");
        router.refresh();
        return;
      }
      setFormError(response.status === 401 ? t("invalidCredentials") : validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="email" label={fields("email")} type="email" autoComplete="email" />
        <TextField
          control={form.control}
          name="password"
          label={fields("password")}
          type="password"
          autoComplete="current-password"
        />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
