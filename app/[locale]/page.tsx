import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";

/** Placeholder home until the signed-in layout (step 4) and Today (v0.3). */
export default function Home() {
  const t = useTranslations("Home");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Kairo</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
      {/* Reads the session, so it streams in after the rest of the page. */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">{t("checking")}</p>}>
        <SessionStatus />
      </Suspense>
    </main>
  );
}

async function SessionStatus() {
  const t = await getTranslations("Home");
  const user = await getCurrentUser();
  if (user) {
    return <p className="text-sm text-muted-foreground">{t("signedInAs", { name: user.name })}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">{t("notSignedIn")}</p>
      <Button asChild>
        <Link href="/sign-in">{t("signIn")}</Link>
      </Button>
    </div>
  );
}
