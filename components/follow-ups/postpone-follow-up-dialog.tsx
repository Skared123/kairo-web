"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { FieldError, FieldGroup } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { POSTPONE_CHOICES, postponeSchema, type PostponeValues } from "@/lib/forms/postpone-schema";
import { addDays } from "@/lib/today";
import { saveFollowUp, type FollowUpTarget } from "./follow-up-target";

/**
 * Moves a job's or a contact's follow-up to another day (v0.3 design): a quick choice saves at once; "another day"
 * takes a date. The note stays. `today` is the browser's day (API decision 035).
 */
export function PostponeFollowUpDialog({
  target,
  today,
  dayLabel,
}: {
  target: FollowUpTarget;
  today: string;
  dayLabel: (day: string) => string;
}) {
  const t = useTranslations("FollowUps.postpone");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PostponeValues>({
    resolver: zodResolver(
      postponeSchema({ required: validation("required"), notBeforeToday: t("notBeforeToday") }, today),
    ),
    defaultValues: { on: "" },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset({ on: "" });
      setFormError(null);
    }
  }

  async function postpone(on: string) {
    setPending(true);
    setFormError(null);
    try {
      const { response } = await saveFollowUp(target, { nextFollowUpOn: on });
      // 404: deleted meanwhile; the refresh takes its follow-up away.
      if (response.ok || response.status === 404) {
        setOpen(false);
        router.refresh();
        return;
      }
      setFormError(validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("label", { name: target.label })}>
          <CalendarClock aria-hidden />
          <span className="max-sm:hidden">{t("button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(({ on }) => postpone(on))} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description", { name: target.label, day: dayLabel(target.on) })}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="flex flex-wrap gap-2">
              {POSTPONE_CHOICES.map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => postpone(addDays(today, days))}
                >
                  {t("in", { days })}
                </Button>
              ))}
            </div>
            <TextField control={form.control} name="on" label={t("otherDay")} type="date" min={today} />
            {formError && <FieldError>{formError}</FieldError>}
          </FieldGroup>
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
