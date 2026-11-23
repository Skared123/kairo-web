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
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/forms/auth-schemas";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";

export function ChangePasswordForm() {
  const t = useTranslations("Password");
  const fields = useTranslations("Fields");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema(messages)),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit({ currentPassword, newPassword }: ChangePasswordValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.POST("/auth/password", { body: { currentPassword, newPassword } });
      if (response.ok) {
        // The API rotated this session (new cookie) and ended the others; the forced change, if any, is over.
        router.push("/");
        router.refresh();
        return;
      }
      if (response.status === 400) {
        // The schema already checks the rest, so a 400 here means the current password was wrong.
        form.setError("currentPassword", { message: t("wrongCurrent") });
        return;
      }
      if (response.status === 401) {
        // The session ended meanwhile (signed out elsewhere): sign in again.
        router.replace("/sign-in");
        router.refresh();
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
        <TextField
          control={form.control}
          name="currentPassword"
          label={fields("currentPassword")}
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="newPassword"
          label={fields("newPassword")}
          type="password"
          autoComplete="new-password"
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label={fields("confirmPassword")}
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
