import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CriteriaBadges } from "@/components/criteria-badges";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { listJobs, type JobFilters } from "@/lib/api/jobs";
import { JOB_STATUSES, type JobSort, type JobStatus } from "@/lib/api/types";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/format-day";
import { cn } from "@/lib/utils";
import { SearchBox } from "./search-box";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The user's jobs: a tab per stage, search and sorting (API decision 030). */
export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Jobs");
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {/* The filters come from the URL and the jobs from the session: both are request-time data. */}
      <Suspense fallback={null}>
        <JobsView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Reads only the filters the API understands, and ignores anything else in the URL. */
function toFilters(params: Awaited<SearchParams>): JobFilters {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const status = one(params.status);
  const q = one(params.q)?.trim();
  return {
    status: JOB_STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined,
    q: q || undefined,
    sort: one(params.sort) === "followUp" ? "followUp" : undefined,
  };
}

async function JobsView({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const [t, locale, filters] = await Promise.all([getTranslations("Jobs"), getLocale(), searchParams.then(toFilters)]);
  const jobs = await listJobs(filters);

  return (
    <div className="flex flex-col gap-4">
      <StageTabs filters={filters} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox filters={filters} />
        <SortLinks filters={filters} />
      </div>
      {jobs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {filters.status || filters.q ? t("empty.filtered") : t("empty.none")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.company")}</TableHead>
              <TableHead>{t("columns.title")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.followUp")}</TableHead>
              <TableHead>{t("columns.criteria")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.company}</TableCell>
                <TableCell>{job.title}</TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell>
                  {job.nextFollowUpOn ? (
                    <span title={job.nextFollowUpNote ?? undefined}>{formatDay(job.nextFollowUpOn, locale)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <CriteriaBadges criteria={job.criteria} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/** "All" plus a tab per stage. Each keeps the search and the sorting. */
async function StageTabs({ filters }: { filters: JobFilters }) {
  const [t, stages] = await Promise.all([getTranslations("Jobs"), getTranslations("JobStatus")]);
  const tabs: { status: JobStatus | undefined; label: string }[] = [
    { status: undefined, label: t("all") },
    ...JOB_STATUSES.map((status) => ({ status, label: stages(status) })),
  ];
  return (
    <nav aria-label={t("columns.status")} className="flex flex-wrap gap-1 border-b pb-2">
      {tabs.map(({ status, label }) => {
        const active = filters.status === status;
        return (
          <Link
            key={status ?? "all"}
            href={{ pathname: "/jobs", query: { ...filters, status } }}
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

async function SortLinks({ filters }: { filters: JobFilters }) {
  const t = await getTranslations("Jobs.sort");
  const options: { sort: JobSort | undefined; label: string }[] = [
    { sort: undefined, label: t("updated") },
    { sort: "followUp", label: t("followUp") },
  ];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("label")}</span>
      {options.map(({ sort, label }) => {
        const active = filters.sort === sort;
        return (
          <Link
            key={sort ?? "updated"}
            href={{ pathname: "/jobs", query: { ...filters, sort } }}
            aria-current={active ? "true" : undefined}
            className={cn("rounded-md px-2 py-1", active ? "bg-secondary font-medium" : "hover:bg-muted")}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
