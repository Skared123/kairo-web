import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { listContacts, type ContactFilters } from "@/lib/api/contacts";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/format-day";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The user's contacts, by name, with search (docs/design/v0.4-contacts.md). */
export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Contacts");
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/contacts/new">
            <Plus aria-hidden />
            {t("new")}
          </Link>
        </Button>
      </div>
      {/* The search comes from the URL and the contacts from the session: both are request-time data. */}
      <Suspense fallback={null}>
        <ContactsView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Reads only the search, and ignores anything else in the URL. */
function toFilters(params: Awaited<SearchParams>): Pick<ContactFilters, "q"> {
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim();
  return { q: q || undefined };
}

async function ContactsView({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const [t, kinds, locale, filters] = await Promise.all([
    getTranslations("Contacts"),
    getTranslations("ContactKind"),
    getLocale(),
    searchParams.then(toFilters),
  ]);
  const contacts = await listContacts(filters);
  const day = (value: string | null, title?: string | null) =>
    value ? (
      <span title={title ?? undefined}>{formatDay(value, locale)}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  return (
    <div className="flex flex-col gap-4">
      <SearchBox pathname="/contacts" query={filters} label={t("search.label")} submitLabel={t("search.submit")} />
      {contacts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {filters.q ? t("empty.filtered") : t("empty.none")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.company")}</TableHead>
              <TableHead>{t("columns.kind")}</TableHead>
              <TableHead>{t("columns.lastInteraction")}</TableHead>
              <TableHead>{t("columns.followUp")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">
                  <Link href={`/contacts/${contact.id}/edit`} className="hover:underline">
                    {contact.name}
                  </Link>
                  {contact.role && <span className="block text-xs text-muted-foreground">{contact.role}</span>}
                </TableCell>
                <TableCell>{contact.company ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  {contact.kind ? kinds(contact.kind) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>{day(contact.lastInteractionOn)}</TableCell>
                <TableCell>{day(contact.nextFollowUpOn, contact.nextFollowUpNote)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
