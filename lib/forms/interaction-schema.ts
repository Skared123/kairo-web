import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import { INTERACTION_CHANNELS, type Interaction } from "@/lib/api/types";
import type { ValidationMessages } from "./auth-schemas";

export type InteractionPayload =
  paths["/contacts/{contactId}/interactions"]["post"]["requestBody"]["content"]["application/json"];

/** A conversation as the inputs hold it (API decision 038). A day and a channel are required. */
export function interactionFormSchema(m: ValidationMessages) {
  return z.object({
    occurredOn: z.string().min(1, m.required).pipe(z.iso.date(m.required)),
    channel: z.union([z.enum(INTERACTION_CHANNELS), z.literal("")]).refine((value) => value !== "", m.required),
    note: z.string().trim().max(2_000, m.tooLong(2_000)),
  });
}

export type InteractionFormValues = z.input<ReturnType<typeof interactionFormSchema>>;

/** A new conversation: today (the browser's, API decision 035), no channel yet. */
export function emptyInteraction(today: string): InteractionFormValues {
  return { occurredOn: today, channel: "", note: "" };
}

export function fromInteraction(interaction: Interaction): InteractionFormValues {
  return { occurredOn: interaction.occurredOn, channel: interaction.channel, note: interaction.note ?? "" };
}

/** Valid values as the API takes them; an empty note becomes null, so an edit can clear it. */
export function toInteractionPayload(values: InteractionFormValues): InteractionPayload {
  return {
    occurredOn: values.occurredOn,
    channel: values.channel as InteractionPayload["channel"],
    note: values.note.trim() === "" ? null : values.note.trim(),
  };
}
