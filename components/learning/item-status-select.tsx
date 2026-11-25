"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { LEARNING_STATUSES, type LearningItem, type LearningStatus } from "@/lib/api/types";

/**
 * Changes an item's status in place (API decision 041); done or dropped also takes its focus away. Like FocusStar, the
 * new status shows at once and the select waits for the refresh, which then puts the item where it sorts.
 */
export function ItemStatusSelect({ item }: { item: Pick<LearningItem, "id" | "title" | "status"> }) {
  const t = useTranslations("Learning");
  const statuses = useTranslations("LearningStatus");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [status, setStatus] = useOptimistic(item.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: LearningStatus) {
    setError(null);
    startTransition(async () => {
      setStatus(next);
      try {
        const { response } = await browserApi.PATCH("/learning/{id}", {
          params: { path: { id: item.id } },
          body: { status: next },
        });
        // 404: deleted in another tab; the refresh takes it away.
        if (!response.ok && response.status !== 404) {
          setError(validation("unexpected"));
        }
      } catch {
        setError(validation("unexpected"));
      }
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Select value={status} onValueChange={(value) => change(value as LearningStatus)} disabled={pending}>
        <SelectTrigger size="sm" aria-label={t("statusOf", { title: item.title })} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEARNING_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {statuses(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
