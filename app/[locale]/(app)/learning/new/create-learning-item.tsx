"use client";

import { useTranslations } from "next-intl";
import { LearningForm } from "@/components/learning/learning-form";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { EMPTY_LEARNING_FORM, type LearningPayload } from "@/lib/forms/learning-schema";

/** Saves a new learning item, then goes back to the list. */
export function CreateLearningItem({ skillNames }: { skillNames: string[] }) {
  const t = useTranslations("LearningForm");
  const validation = useTranslations("Validation");
  const router = useRouter();

  async function save(payload: LearningPayload): Promise<string | void> {
    try {
      const { response } = await browserApi.POST("/learning", { body: payload });
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
    <LearningForm defaultValues={EMPTY_LEARNING_FORM} skillNames={skillNames} submitLabel={t("create")} onSave={save} />
  );
}
