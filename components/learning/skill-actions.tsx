"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Skill } from "@/lib/api/types";
import { MAX_SKILL_NAME } from "@/lib/forms/learning-schema";

/** Renames a skill in a dialog; a name the user already has is refused, never merged (API decision 040). */
export function RenameSkillDialog({ skill }: { skill: Skill }) {
  const t = useTranslations("Skills.rename");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(skill.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(skill.name);
      setError(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "") {
      setError(validation("required"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.PATCH("/skills/{id}", {
        params: { path: { id: skill.id } },
        body: { name },
      });
      if (response.ok || response.status === 404) {
        setOpen(false);
        router.refresh();
        return;
      }
      setError(response.status === 409 ? t("exists") : validation("unexpected"));
    } catch {
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("button", { name: skill.name })}>
          <Pencil aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={id}>{t("label")}</FieldLabel>
            <Input
              id={id}
              value={name}
              maxLength={MAX_SKILL_NAME}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!error}
              autoComplete="off"
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Deletes a skill after a confirmation; its items stay, without it. */
export function DeleteSkillButton({ skill }: { skill: Skill }) {
  const t = useTranslations("Skills.delete");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.DELETE("/skills/{id}", { params: { path: { id: skill.id } } });
      // 404: already gone, which is what the user wanted.
      if (response.ok || response.status === 404) {
        router.refresh();
        return;
      }
      setError(validation("unexpected"));
    } catch {
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("button", { name: skill.name })}>
          <Trash2 aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { name: skill.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("description", { count: skill.itemCount })}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FieldError>{error}</FieldError>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            {pending ? t("deleting") : t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
