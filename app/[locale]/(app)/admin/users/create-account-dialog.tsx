"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { createAccountSchema, ROLES, type CreateAccountValues } from "@/lib/forms/account-schemas";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";
import { TemporaryPasswordView } from "./temporary-password-view";

const EMPTY: CreateAccountValues = { name: "", email: "", role: "user" };

/** "New account": the form, then the generated temporary password, shown once. */
export function CreateAccountDialog() {
  const t = useTranslations("Admin");
  const fields = useTranslations("Fields");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ name: string; password: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateAccountValues>({ resolver: zodResolver(createAccountSchema(messages)), defaultValues: EMPTY });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Closing forgets the temporary password: it is never shown again.
      form.reset(EMPTY);
      setCreated(null);
      setFormError(null);
    }
  }

  async function onSubmit(values: CreateAccountValues) {
    setFormError(null);
    try {
      const { data, response } = await browserApi.POST("/admin/users", { body: values });
      if (data) {
        setCreated({ name: data.account.name, password: data.temporaryPassword });
        router.refresh();
        return;
      }
      if (response.status === 409) {
        form.setError("email", { message: t("create.emailTaken") });
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
        <Button>
          <UserPlus aria-hidden />
          {t("newAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <TemporaryPasswordView name={created.name} password={created.password} onDone={() => onOpenChange(false)} />
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>{t("create.title")}</DialogTitle>
              <DialogDescription>{t("create.description")}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <TextField control={form.control} name="name" label={fields("name")} autoComplete="off" />
              <TextField control={form.control} name="email" label={fields("email")} type="email" autoComplete="off" />
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{fields("role")}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label={fields("role")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`roles.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              {formError && <FieldError>{formError}</FieldError>}
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t("create.submitting") : t("create.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
