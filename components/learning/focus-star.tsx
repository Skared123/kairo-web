"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { LearningItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Makes an item the user's focus, the one Today shows, or takes it away (API decision 042). Marking another moves the
 * focus; the API keeps at most one.
 *
 * The star changes at once (useOptimistic) and stays disabled until the refresh that follows the save has arrived:
 * then it shows the saved value again, so an older refresh can never put back a star the user moved
 * (node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md).
 */
export function FocusStar({ item }: { item: Pick<LearningItem, "id" | "title" | "isFocus"> }) {
  const t = useTranslations("Learning.focus");
  const router = useRouter();
  const [focus, setFocus] = useOptimistic(item.isFocus);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setFocus(!focus);
      try {
        await browserApi.PATCH("/learning/{id}", {
          params: { path: { id: item.id } },
          body: { isFocus: !focus },
        });
      } finally {
        // Whatever the answer, the server's value wins: a failed save simply shows the star as it was.
        startTransition(() => router.refresh());
      }
    });
  }

  return (
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
  );
}
