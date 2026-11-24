import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getToday } from "@/lib/api/today";
import { requireUser } from "@/lib/auth";
import { TodayView } from "./today-view";

/** Today (API decision 034): the tasks and follow-ups to act on, in one screen. It is the home page. */
export default function TodayPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      {/* The session and the user's items: request-time data. */}
      <Suspense fallback={null}>
        <TodayContent />
      </Suspense>
    </main>
  );
}

async function TodayContent() {
  const t = await getTranslations("Today");
  const user = await requireUser();
  const today = await getToday();
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("greeting", { name: user.name })}</p>
      </div>
      <TodayView data={today} />
    </>
  );
}
