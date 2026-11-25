import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLearningItem, listSkills } from "@/lib/api/learning";
import { requireUser } from "@/lib/auth";
import { EditLearningItem } from "./edit-learning-item";

/** Edit or delete one of the user's learning items; anyone else's answers "not found", as the API does. */
export default async function EditLearningItemPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("LearningForm");
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
  const [item, skills] = await Promise.all([getLearningItem((await params).id), listSkills()]);
  if (!item) {
    notFound();
  }
  return <EditLearningItem item={item} skillNames={skills.map((skill) => skill.name)} />;
}
