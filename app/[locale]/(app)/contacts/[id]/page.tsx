import { ExternalLink, Mail, Pencil, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { DeleteContact } from "@/components/contacts/delete-contact";
import { ContactJobs } from "@/components/contacts/contact-jobs";
import { InteractionLog } from "@/components/contacts/interaction-log";
import { toJobOptions } from "@/components/tasks/job-option";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getContact, listInteractions } from "@/lib/api/contacts";
import { listJobs } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/format-day";

/** One contact: how to reach them, their conversations, their jobs and the next follow-up. */
export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6">
      {/* The contact comes from the session and the URL: request-time data. */}
      <Suspense fallback={null}>
        <ContactDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) {
    // Missing, or another user's: the API answers 404 to both, and so does this page.
    notFound();
  }
  // Every job, for linking another one.
  const [interactions, jobs, t, kinds, locale] = await Promise.all([
    listInteractions(id),
    listJobs({}),
    getTranslations("ContactDetail"),
    getTranslations("ContactKind"),
    getLocale(),
  ]);
  const section = (name: string) => `${name}-${contact.id}`;

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link href="/contacts" className="text-sm text-muted-foreground hover:underline">
          ← {t("back")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
            <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {contact.role && <span>{contact.role}</span>}
              {contact.kind && <Badge variant="secondary">{kinds(contact.kind)}</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/contacts/${contact.id}/edit`}>
                <Pencil aria-hidden />
                {t("edit")}
              </Link>
            </Button>
            <DeleteContact contactId={contact.id} name={contact.name} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-8">
          <Section id={section("interactions")} title={t("interactions")}>
            <InteractionLog contactId={contact.id} interactions={interactions} />
          </Section>

          {contact.notes && (
            <Section title={t("notes")}>
              <p className="whitespace-pre-wrap text-sm">{contact.notes}</p>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <Section title={t("reach")}>
            {contact.email || contact.phone || contact.linkedinUrl ? (
              <ul className="flex flex-col gap-2 text-sm">
                {contact.email && (
                  <ReachLine icon={<Mail className="size-4" aria-hidden />}>
                    <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                      {contact.email}
                    </a>
                  </ReachLine>
                )}
                {contact.phone && (
                  <ReachLine icon={<Phone className="size-4" aria-hidden />}>
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </ReachLine>
                )}
                {contact.linkedinUrl && (
                  <ReachLine icon={<ExternalLink className="size-4" aria-hidden />}>
                    {/* A link the user typed and opens; Kairo never fetches it (no LinkedIn automation). */}
                    <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {t("linkedin")}
                    </a>
                  </ReachLine>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noReach")}</p>
            )}
          </Section>

          <Section title={t("followUp")}>
            {contact.nextFollowUpOn ? (
              <div className="text-sm">
                <p className="font-medium">{formatDay(contact.nextFollowUpOn, locale)}</p>
                {contact.nextFollowUpNote && <p className="text-muted-foreground">{contact.nextFollowUpNote}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noFollowUp")}</p>
            )}
          </Section>

          <Section id={section("jobs")} title={t("jobs.title")}>
            <ContactJobs contactId={contact.id} jobs={contact.jobs} options={toJobOptions(jobs)} />
          </Section>
        </aside>
      </div>
    </>
  );
}

/** A titled block; with an `id`, its heading names it, so it reads as a region. */
function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReachLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
