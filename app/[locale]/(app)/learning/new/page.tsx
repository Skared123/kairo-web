import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { listSkills } from "@/lib/api/learning";
import { requireUser } from "@/lib/auth";
import { CreateLearningItem } from "./create-learning-item";

/** Add a learning item. */
export default async function NewLearningItemPage() {
  const t = await getTranslations("LearningForm");
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
  const skills = await listSkills();
  return <CreateLearningItem skillNames={skills.map((skill) => skill.name)} />;
}
