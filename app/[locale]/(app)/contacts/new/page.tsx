import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { CreateContact } from "./create-contact";

/** Add a contact. */
export default async function NewContactPage() {
  const t = await getTranslations("ContactForm");
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
  return <CreateContact />;
}
