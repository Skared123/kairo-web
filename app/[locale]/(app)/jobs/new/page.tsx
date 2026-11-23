import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { CreateJob } from "./create-job";

/** Capture a job. */
export default async function NewJobPage() {
  const t = await getTranslations("JobForm");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <Suspense fallback={null}>
        <SignedInForm />
      </Suspense>
    </main>
  );
}

async function SignedInForm() {
  await requireUser();
  return <CreateJob />;
}
