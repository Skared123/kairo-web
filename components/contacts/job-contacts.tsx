"use client";

import { Link2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Contact } from "@/lib/api/types";

type ContactOption = Pick<Contact, "id" | "name" | "company">;

/**
 * A job's contacts (API decision 036): each links to their page and can be unlinked; an existing contact can be
 * linked, or a new one created already linked.
 */
export function JobContacts({
  jobId,
  contacts,
  options,
}: {
  jobId: string;
  contacts: Pick<Contact, "id" | "name" | "kind">[];
  options: ContactOption[];
}) {
  const t = useTranslations("JobDetail.contacts");
  const kinds = useTranslations("ContactKind");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkable = options.filter((option) => !contacts.some((contact) => contact.id === option.id));

  async function change(method: "PUT" | "DELETE", contactId: string) {
    setPending(true);
    setError(null);
    try {
      const params = { path: { id: contactId, jobId } };
      const { response } =
        method === "PUT"
          ? await browserApi.PUT("/contacts/{id}/jobs/{jobId}", { params })
          : await browserApi.DELETE("/contacts/{id}/jobs/{jobId}", { params });
      // 404: the contact or the job was deleted meanwhile; the refresh shows what is left.
      if (response.ok || response.status === 404) {
        setChoice("");
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
    <div className="flex flex-col gap-3">
      {contacts.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex min-w-0 flex-col">
                <Link href={`/contacts/${contact.id}`} className="hover:underline">
                  {contact.name}
                </Link>
                {contact.kind && <span className="text-xs text-muted-foreground">{kinds(contact.kind)}</span>}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() => change("DELETE", contact.id)}
                aria-label={t("unlink", { name: contact.name })}
                className="-my-1 shrink-0"
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      )}
      {linkable.length > 0 && (
        <div className="flex gap-2">
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger aria-label={t("choose")} className="min-w-0 flex-1">
              <SelectValue placeholder={t("choose")} />
            </SelectTrigger>
            <SelectContent>
              {linkable.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.company ? `${option.name} · ${option.company}` : option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={!choice || pending} onClick={() => change("PUT", choice)}>
            <Link2 aria-hidden />
            {t("link")}
          </Button>
        </div>
      )}
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href={{ pathname: "/contacts/new", query: { jobId } }}>
          <Plus aria-hidden />
          {t("new")}
        </Link>
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
