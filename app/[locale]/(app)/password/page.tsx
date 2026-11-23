import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { requireUser } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

/** Change the password; while a temporary one is in use, the only page a user can open (API decision 016). */
export default async function PasswordPage() {
  const t = await getTranslations("Password");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthCard title={t("title")} description={t("description")}>
        <Suspense fallback={null}>
          <PasswordForm />
        </Suspense>
      </AuthCard>
    </main>
  );
}

async function PasswordForm() {
  const t = await getTranslations("Password");
  const user = await requireUser({ allowPendingPasswordChange: true });
  return (
    <div className="flex flex-col gap-4">
      {user.mustChangePassword && (
        <p role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {t("required")}
        </p>
      )}
      <ChangePasswordForm />
    </div>
  );
}
