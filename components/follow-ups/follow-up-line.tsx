"use client";

import { Check, Reply, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemLink, Meta } from "@/components/tasks/item-parts";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { saveFollowUp, type FollowUpTarget } from "./follow-up-target";
import { PostponeFollowUpDialog } from "./postpone-follow-up-dialog";

/**
 * A job's or a contact's follow-up in Today: what it belongs to as a link, its note and day, and Done and Postpone
 * (v0.3 design, API decision 037).
 */
export function FollowUpLine({
  target,
  day,
  today,
  dayLabel,
}: {
  target: FollowUpTarget;
  /** How the day reads in its section; nothing where the section says it (Today). */
  day?: string;
  today: string;
  dayLabel: (day: string) => string;
}) {
  const t = useTranslations("FollowUps");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const forJob = target.type === "job";
  const Icon = forJob ? Reply : UserRound;

  /** Done: no next follow-up, nor its note, until the user sets a new one. */
  async function markDone() {
    setPending(true);
    setError(null);
    try {
      const { response } = await saveFollowUp(target, { nextFollowUpOn: null, nextFollowUpNote: null });
      // 404: deleted meanwhile, so there is nothing left to follow up.
      if (response.ok || response.status === 404) {
        router.refresh();
        return;
      }
      setError(validation("unexpected"));
      setPending(false);
    } catch {
      setError(validation("unexpected"));
      setPending(false);
    }
    // On success it stays pending: the line leaves with the refresh.
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">
          {t(forJob ? "label" : "contactLabel")}: <ItemLink href={target.href}>{target.label}</ItemLink>
        </span>
        <Meta>
          {target.note}
          {day}
        </Meta>
        {error && <FieldError>{error}</FieldError>}
      </div>
      <div className="-my-1 flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={markDone}
          disabled={pending}
          aria-label={t(forJob ? "done.label" : "done.contactLabel", { name: target.label })}
        >
          <Check aria-hidden />
          {/* Icon only on a narrow screen, where the text would squeeze the name. */}
          <span className="max-sm:hidden">{t("done.button")}</span>
        </Button>
        <PostponeFollowUpDialog target={target} today={today} dayLabel={dayLabel} />
      </div>
    </li>
  );
}
