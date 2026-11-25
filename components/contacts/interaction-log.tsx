"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ellipsis, Mail, MessageSquareText, Pencil, Phone, Plus, Trash2, Users, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SelectField, TextareaField } from "@/components/form-fields";
import { TextField } from "@/components/text-field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import { INTERACTION_CHANNELS, type Interaction, type InteractionChannel } from "@/lib/api/types";
import { formatDay } from "@/lib/format-day";
import {
  emptyInteraction,
  fromInteraction,
  interactionFormSchema,
  toInteractionPayload,
  type InteractionFormValues,
} from "@/lib/forms/interaction-schema";
import { useValidationMessages } from "@/lib/forms/use-validation-messages";
import { useBrowserDay } from "@/lib/use-browser-day";

const CHANNEL_ICONS: Record<InteractionChannel, LucideIcon> = {
  email: Mail,
  linkedin: MessageSquareText,
  call: Phone,
  meeting: Users,
  other: Ellipsis,
};

/** The log of conversations with a contact (API decision 038): one line to add one, then each, latest first. */
export function InteractionLog({ contactId, interactions }: { contactId: string; interactions: Interaction[] }) {
  const t = useTranslations("Interactions");
  // A new conversation starts on the browser's today, which the server does not know.
  const today = useBrowserDay();
  return (
    <div className="flex flex-col gap-3">
      {today && <QuickAddInteraction contactId={contactId} today={today} />}
      {interactions.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {interactions.map((interaction) => (
            <InteractionLine key={interaction.id} contactId={contactId} interaction={interaction} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}

function QuickAddInteraction({ contactId, today }: { contactId: string; today: string }) {
  const t = useTranslations("Interactions");
  const channels = useTranslations("InteractionChannel");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema(messages)),
    defaultValues: emptyInteraction(today),
  });

  async function onSubmit(values: InteractionFormValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.POST("/contacts/{contactId}/interactions", {
        params: { path: { contactId } },
        body: toInteractionPayload(values),
      });
      if (response.ok) {
        form.reset(emptyInteraction(today));
        router.refresh();
        return;
      }
      setFormError(validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  const { errors } = form.formState;
  const fieldError = errors.channel?.message ?? errors.occurredOn?.message ?? errors.note?.message;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`${id}-day`} className="sr-only">
          {t("fields.occurredOn")}
        </label>
        <Input {...form.register("occurredOn")} id={`${id}-day`} type="date" className="w-36" />
        <Controller
          control={form.control}
          name="channel"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger aria-label={t("fields.channel")} aria-invalid={!!errors.channel} className="w-32">
                <SelectValue placeholder={t("fields.channel")} />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channels(channel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <label htmlFor={`${id}-note`} className="sr-only">
          {t("fields.note")}
        </label>
        <Input
          {...form.register("note")}
          id={`${id}-note`}
          placeholder={t("add.placeholder")}
          autoComplete="off"
          className="min-w-32 flex-1"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Plus aria-hidden />
          {form.formState.isSubmitting ? t("add.adding") : t("add.submit")}
        </Button>
      </div>
      {fieldError && <FieldError>{fieldError}</FieldError>}
      {formError && <FieldError>{formError}</FieldError>}
    </form>
  );
}

function InteractionLine({ contactId, interaction }: { contactId: string; interaction: Interaction }) {
  const channels = useTranslations("InteractionChannel");
  const locale = useLocale();
  const Icon = CHANNEL_ICONS[interaction.channel];
  const label = `${channels(interaction.channel)} · ${formatDay(interaction.occurredOn, locale)}`;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {interaction.note && (
          <span className="whitespace-pre-wrap text-sm text-muted-foreground">{interaction.note}</span>
        )}
      </div>
      <div className="-my-1 flex shrink-0 gap-1">
        <EditInteractionDialog contactId={contactId} interaction={interaction} label={label} />
        <DeleteInteractionButton contactId={contactId} interaction={interaction} label={label} />
      </div>
    </li>
  );
}

function EditInteractionDialog({
  contactId,
  interaction,
  label,
}: {
  contactId: string;
  interaction: Interaction;
  label: string;
}) {
  const t = useTranslations("Interactions");
  const channels = useTranslations("InteractionChannel");
  const validation = useTranslations("Validation");
  const messages = useValidationMessages();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema(messages)),
    defaultValues: fromInteraction(interaction),
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(fromInteraction(interaction));
      setFormError(null);
    }
  }

  async function onSubmit(values: InteractionFormValues) {
    setFormError(null);
    try {
      const { response } = await browserApi.PATCH("/contacts/{contactId}/interactions/{id}", {
        params: { path: { contactId, id: interaction.id } },
        body: toInteractionPayload(values),
      });
      // 404: deleted meanwhile; the refresh takes it away.
      if (response.ok || response.status === 404) {
        setOpen(false);
        router.refresh();
        return;
      }
      setFormError(validation("unexpected"));
    } catch {
      setFormError(validation("unexpected"));
    }
  }

  const options = INTERACTION_CHANNELS.map((value) => ({ value, label: channels(value) }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("edit.button", { interaction: label })}>
          <Pencil aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{t("edit.title")}</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <TextField control={form.control} name="occurredOn" label={t("fields.occurredOn")} type="date" />
            <SelectField
              control={form.control}
              name="channel"
              label={t("fields.channel")}
              options={options}
              noneLabel="—"
            />
            <TextareaField control={form.control} name="note" label={t("fields.note")} rows={3} />
            {formError && <FieldError>{formError}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("edit.saving") : t("edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteInteractionButton({
  contactId,
  interaction,
  label,
}: {
  contactId: string;
  interaction: Interaction;
  label: string;
}) {
  const t = useTranslations("Interactions.delete");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const { response } = await browserApi.DELETE("/contacts/{contactId}/interactions/{id}", {
        params: { path: { contactId, id: interaction.id } },
      });
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
        <Button variant="ghost" size="icon-sm" aria-label={t("button", { interaction: label })}>
          <Trash2 aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { interaction: label })}</AlertDialogTitle>
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
