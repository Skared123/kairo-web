"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { LearningItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Makes an item the user's focus, the one Today shows, or takes it away (API decision 042). Marking another moves the
 * focus; the API keeps at most one. It sits beside the item's title (`children`), and a failed save is said under it.
 * A finished item cannot be the focus: it gets an empty space instead, so titles stay aligned.
 *
 * The star changes at once (useOptimistic) and stays disabled until the refresh that follows the save has arrived:
 * then it shows the saved value again, so an older refresh can never put back a star the user moved
 * (node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md).
 */
export function FocusStar({
  item,
  finished,
  children,
}: {
  item: Pick<LearningItem, "id" | "title" | "isFocus">;
  finished: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Learning.focus");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [focus, setFocus] = useOptimistic(item.isFocus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      setFocus(!focus);
      try {
        const { response } = await browserApi.PATCH("/learning/{id}", {
          params: { path: { id: item.id } },
          body: { isFocus: !focus },
        });
        // 404: deleted in another tab; the refresh takes it away.
        if (!response.ok && response.status !== 404) {
          setError(validation("unexpected"));
        }
      } catch {
        setError(validation("unexpected"));
      }
      // Whatever the answer, the server's value wins: a failed save shows the star as it was.
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="flex items-start gap-2">
      {finished ? (
        <span className="size-7 shrink-0" />
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          disabled={pending}
          aria-pressed={focus}
          aria-label={t("toggle", { title: item.title })}
          title={focus ? t("is") : t("make")}
        >
          <Star className={cn(focus ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} aria-hidden />
        </Button>
      )}
      <div className="flex flex-col gap-1">
        {children}
        {error && <FieldError>{error}</FieldError>}
      </div>
    </div>
  );
}
