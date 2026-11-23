import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getCriteria } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth";
import { CriteriaForm } from "./criteria-form";

/** The user's criteria: the target salary lives only in the database (API decision 029). */
export default async function CriteriaPage() {
  const t = await getTranslations("Criteria");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link href="/jobs" className="text-sm text-muted-foreground hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Suspense fallback={null}>
        <LoadedForm />
      </Suspense>
    </main>
  );
}

async function LoadedForm() {
  await requireUser();
  return <CriteriaForm criteria={await getCriteria()} />;
}
