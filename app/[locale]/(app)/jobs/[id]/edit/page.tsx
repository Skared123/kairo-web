import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJob } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth";
import { EditJob } from "./edit-job";

/** Edit one of the user's jobs; anyone else's answers "not found", as the API does. */
export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("JobForm");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
      <Suspense fallback={null}>
        <LoadedForm params={params} />
      </Suspense>
    </main>
  );
}

async function LoadedForm({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const job = await getJob((await params).id);
  if (!job) {
    notFound();
  }
  return <EditJob job={job} />;
}
