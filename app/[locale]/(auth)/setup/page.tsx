import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { redirect } from "@/i18n/navigation";
import { needsSetup } from "@/lib/api/needs-setup";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const t = await getTranslations("Setup");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthCard title={t("title")} description={t("description")}>
        <Suspense fallback={null}>
          <SetupGate />
        </Suspense>
      </AuthCard>
    </main>
  );
}

/** The first-run screen exists only until the first admin does (API decision 010). */
async function SetupGate() {
  if (!(await needsSetup())) {
    redirect({ href: "/sign-in", locale: await getLocale() });
  }
  return <SetupForm />;
}
