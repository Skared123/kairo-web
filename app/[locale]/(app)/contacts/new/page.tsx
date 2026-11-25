import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getJob } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth";
import { CreateContact } from "./create-contact";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Add a contact. Opened from a job's page (`?jobId=`), the new contact is linked to that job. */
export default async function NewContactPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("ContactForm");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <Suspense fallback={null}>
        <SignedInForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignedInForm({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const { jobId } = await searchParams;
  // Only one of the user's own jobs: anything else in the URL is ignored, and the API checks again.
  const job = typeof jobId === "string" ? await getJob(jobId) : null;
  return (
    <CreateContact
      job={job ? { id: job.id, company: job.company, label: `${job.company} · ${job.title}` } : undefined}
    />
  );
}
