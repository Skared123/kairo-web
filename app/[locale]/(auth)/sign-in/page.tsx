import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { redirect } from "@/i18n/navigation";
import { needsSetup } from "@/lib/api/needs-setup";
import { getCurrentUser } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const t = await getTranslations("SignIn");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthCard title={t("title")} description={t("description")}>
        {/* No form as the fallback: the streamed one would replace it and drop what was typed. */}
        <Suspense fallback={null}>
          <SetupGate />
        </Suspense>
      </AuthCard>
    </main>
  );
}

/**
 * Before the first admin exists, there is nobody to sign in: go to the first-run screen.
 * Someone already signed in has nothing to do here: go home.
 */
async function SetupGate() {
  const locale = await getLocale();
  if (await needsSetup()) {
    redirect({ href: "/setup", locale });
  }
  if (await getCurrentUser()) {
    redirect({ href: "/", locale });
  }
  return <SignInForm />;
}
