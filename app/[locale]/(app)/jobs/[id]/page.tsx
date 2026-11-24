import { ArrowRight, ExternalLink, Pencil } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ClientDate } from "@/components/client-date";
import { CriteriaBadges } from "@/components/criteria-badges";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import { toJobOptions } from "@/components/tasks/job-option";
import { Link } from "@/i18n/navigation";
import { getJob, getJobHistory, listJobs } from "@/lib/api/jobs";
import { listTasks } from "@/lib/api/tasks";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/format-day";
import { formatSalary } from "@/lib/format-salary";
import { DeleteJob } from "./delete-job";
import { JobTasks } from "./job-tasks";
import { StageSelect } from "./stage-select";

/** One job: everything saved about it, its stage and history, its next follow-up and its tasks. */
export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6">
      {/* The job comes from the session and the URL: request-time data. */}
      <Suspense fallback={null}>
        <JobDetail params={params} />
      </Suspense>
    </main>
  );
}

async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    // Missing, or another user's: the API answers 404 to both, and so does this page.
    notFound();
  }
  // Every job, for moving a task to another one from its edit dialog.
  const [history, tasks, jobs, t, form, stages, locale] = await Promise.all([
    getJobHistory(id),
    listTasks({ jobId: id }),
    listJobs({}),
    getTranslations("JobDetail"),
    getTranslations("JobForm"),
    getTranslations("JobStatus"),
    getLocale(),
  ]);
  const salary = formatSalary(job, locale);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link href="/jobs" className="text-sm text-muted-foreground hover:underline">
          ← {t("back")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
            <div>
              <JobStatusBadge status={job.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.url && (
              <Button asChild variant="outline">
                <a href={job.url} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden />
                  {t("openPosting")}
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/jobs/${job.id}/edit`}>
                <Pencil aria-hidden />
                {t("edit")}
              </Link>
            </Button>
            <DeleteJob jobId={job.id} name={`${job.company} · ${job.title}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-8">
          <Section title={form("sections.conditions")}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <Detail label={form("fields.workMode")}>
                {job.workMode && form(`options.workMode.${job.workMode}`)}
              </Detail>
              <Detail label={form("fields.location")}>{job.location}</Detail>
              <Detail label={form("fields.contractType")}>
                {job.contractType && form(`options.contractType.${job.contractType}`)}
              </Detail>
              <Detail label={form("fields.timeZoneNotes")}>{job.timeZoneNotes}</Detail>
              <Detail label={t("salary")}>
                {salary && `${salary} ${job.salaryPeriod ? form(`options.period.${job.salaryPeriod}`).toLowerCase() : ""}`}
              </Detail>
              <Detail label={form("fields.source")}>{job.source && form(`options.source.${job.source}`)}</Detail>
            </dl>
          </Section>

          <Section id={`tasks-${job.id}`} title={t("tasks.title")}>
            <JobTasks jobId={job.id} tasks={tasks} jobs={toJobOptions(jobs)} locale={locale} />
          </Section>

          <Section title={form("fields.description")}>
            {job.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noDescription")}</p>
            )}
          </Section>

          {job.notes && (
            <Section title={form("fields.notes")}>
              <p className="whitespace-pre-wrap text-sm">{job.notes}</p>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <StageSelect jobId={job.id} status={job.status} />

          <Section title={form("sections.followUp")}>
            {job.nextFollowUpOn ? (
              <div className="text-sm">
                <p className="font-medium">{formatDay(job.nextFollowUpOn, locale)}</p>
                {job.nextFollowUpNote && <p className="text-muted-foreground">{job.nextFollowUpNote}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noFollowUp")}</p>
            )}
          </Section>

          <Section title={t("criteria")}>
            <CriteriaBadges criteria={job.criteria} />
            <Link href="/criteria" className="text-xs text-muted-foreground hover:underline">
              {t("editCriteria")}
            </Link>
          </Section>

          <Section title={t("history")}>
            <ol className="flex flex-col gap-2 text-sm">
              {history.map((change) => (
                <li key={change.changedAt + change.toStatus} className="flex flex-col">
                  <span className="flex items-center gap-1">
                    {change.fromStatus ? (
                      <>
                        {stages(change.fromStatus)}
                        <ArrowRight className="size-3.5" aria-label={t("to")} />
                        {stages(change.toStatus)}
                      </>
                    ) : (
                      t("created", { stage: stages(change.toStatus) })
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <ClientDate value={change.changedAt} />
                  </span>
                </li>
              ))}
            </ol>
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

/** A label and its value; an empty value shows a dash, so the layout never shifts. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children || <span className="text-muted-foreground">—</span>}</dd>
    </>
  );
}
