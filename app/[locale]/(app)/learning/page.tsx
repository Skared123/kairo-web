import { ExternalLink, Plus, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FocusStar } from "@/components/learning/focus-star";
import { ItemStatusSelect } from "@/components/learning/item-status-select";
import { SkillFilter } from "@/components/learning/skill-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { listLearning, listSkills, type LearningFilters } from "@/lib/api/learning";
import { LEARNING_STATUSES, type LearningStatus } from "@/lib/api/types";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** What the user studies or builds: a tab per status and a filter by skill (docs/design/v0.5-learning.md). */
export default async function LearningPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Learning");
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/skills">
              <Tags aria-hidden />
              {t("skillsLink")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/learning/new">
              <Plus aria-hidden />
              {t("new")}
            </Link>
          </Button>
        </div>
      </div>
      {/* The filters come from the URL and the items from the session: both are request-time data. */}
      <Suspense fallback={null}>
        <LearningView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Reads only the filters the API understands; a skill id is checked against the user's skills. */
function toFilters(params: Awaited<SearchParams>): LearningFilters {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const status = one(params.status);
  return {
    status: LEARNING_STATUSES.includes(status as LearningStatus) ? (status as LearningStatus) : undefined,
    skillId: one(params.skillId) || undefined,
  };
}

async function LearningView({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const [t, kinds, skills, params] = await Promise.all([
    getTranslations("Learning"),
    getTranslations("LearningKind"),
    listSkills(),
    searchParams,
  ]);
  const requested = toFilters(params);
  // Anything that is not one of the user's skills is ignored, like any other unknown filter.
  const known = skills.some((skill) => skill.id === requested.skillId);
  const filters = { ...requested, skillId: known ? requested.skillId : undefined };
  const items = await listLearning(filters);

  return (
    <div className="flex flex-col gap-4">
      <StatusTabs filters={filters} />
      {skills.length > 0 && <SkillFilter skills={skills} query={filters} />}
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {filters.status || filters.skillId ? t("empty.filtered") : t("empty.none")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.item")}</TableHead>
              <TableHead>{t("columns.skills")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-start gap-2">
                    {/* A finished item cannot be the focus (API decision 042); the space keeps titles aligned. */}
                    {item.status === "done" || item.status === "dropped" ? (
                      <span className="size-7 shrink-0" />
                    ) : (
                      <FocusStar item={item} />
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/learning/${item.id}/edit`} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t("open", { title: item.title })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{kinds(item.kind)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {item.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ItemStatusSelect item={item} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/** "All" plus a tab per status. Each keeps the skill filter. */
async function StatusTabs({ filters }: { filters: LearningFilters }) {
  const [t, statuses] = await Promise.all([getTranslations("Learning"), getTranslations("LearningStatus")]);
  const tabs: { status: LearningStatus | undefined; label: string }[] = [
    { status: undefined, label: t("all") },
    ...LEARNING_STATUSES.map((status) => ({ status, label: statuses(status) })),
  ];
  return (
    <nav aria-label={t("columns.status")} className="flex flex-wrap gap-1 border-b pb-2">
      {tabs.map(({ status, label }) => {
        const active = filters.status === status;
        return (
          <Link
            key={status ?? "all"}
            href={{ pathname: "/learning", query: { ...filters, status } }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
