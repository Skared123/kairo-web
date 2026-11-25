import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getContact } from "@/lib/api/contacts";
import { requireUser } from "@/lib/auth";
import { EditContact } from "./edit-contact";

/** Edit one of the user's contacts; anyone else's answers "not found", as the API does. */
export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("ContactForm");
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
  const contact = await getContact((await params).id);
  if (!contact) {
    notFound();
  }
  return <EditContact contact={contact} />;
}
