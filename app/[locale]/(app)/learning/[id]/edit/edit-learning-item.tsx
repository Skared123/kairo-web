"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LearningForm } from "@/components/learning/learning-form";
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
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { LearningItem } from "@/lib/api/types";
import { fromLearningItem, type LearningPayload } from "@/lib/forms/learning-schema";

/** Edits a learning item; every field is sent, so an emptied one is cleared and the skills are the whole set. */
export function EditLearningItem({ item, skillNames }: { item: LearningItem; skillNames: string[] }) {
  const t = useTranslations("LearningForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: LearningPayload): Promise<string | void> {
    try {
      const { response } = await browserApi.PATCH("/learning/{id}", {
        params: { path: { id: item.id } },
        body: payload,
      });
      if (response.status === 404) {
        return t("notFound");
      }
      if (!response.ok) {
        return validation("unexpected");
      }
      router.push("/learning");
      router.refresh();
    } catch {
      return validation("unexpected");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <LearningForm
        defaultValues={fromLearningItem(item)}
        skillNames={skillNames}
        submitLabel={t("save")}
        onSave={save}
      />
      <DeleteLearningItem item={item} />
    </div>
  );
}

/** Deletes the item after a confirmation; the user's skills stay. */
function DeleteLearningItem({ item }: { item: LearningItem }) {
  const t = useTranslations("LearningForm.delete");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.DELETE("/learning/{id}", { params: { path: { id: item.id } } });
      // 404: already gone, which is what the user wanted.
      if (response.ok || response.status === 404) {
        router.push("/learning");
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
    <div className="border-t pt-6">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <Trash2 aria-hidden />
            {t("button")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("title", { title: item.title })}</AlertDialogTitle>
            <AlertDialogDescription>{t("description")}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <FieldError>{error}</FieldError>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
            {/* A plain button, so the dialog stays open while deleting and on an error. */}
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? t("deleting") : t("confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
