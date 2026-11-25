"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

/** Deletes the contact with its conversations and links, after a confirmation. Its jobs stay. */
export function DeleteContact({ contactId, name }: { contactId: string; name: string }) {
  const t = useTranslations("ContactDetail.delete");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.DELETE("/contacts/{id}", { params: { path: { id: contactId } } });
      // 404: already gone, which is what the user wanted.
      if (response.ok || response.status === 404) {
        router.push("/contacts");
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
        <Button variant="outline">
          <Trash2 aria-hidden />
          {t("button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { name })}</AlertDialogTitle>
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
  );
}
