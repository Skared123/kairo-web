import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

/** Home: a placeholder until Today (v0.3). */
export default function Home() {
  const t = useTranslations("Home");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      {/* Reads the session, so it streams in after the rest of the page. */}
      <Suspense fallback={<h1 className="text-3xl font-semibold tracking-tight">Kairo</h1>}>
        <Greeting />
      </Suspense>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </main>
  );
}

async function Greeting() {
  const t = await getTranslations("Home");
  const user = await requireUser();
  return <h1 className="text-3xl font-semibold tracking-tight">{t("greeting", { name: user.name })}</h1>;
}
