import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DeleteSkillButton, RenameSkillDialog } from "@/components/learning/skill-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { listSkills } from "@/lib/api/learning";
import { requireUser } from "@/lib/auth";

/** The user's skills (API decision 040): how many items train each, rename and delete. */
export default async function SkillsPage() {
  const t = await getTranslations("Skills");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <Link href="/learning" className="text-sm text-muted-foreground hover:underline">
          ← {t("back")}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <Suspense fallback={null}>
        <SkillsView />
      </Suspense>
    </main>
  );
}

async function SkillsView() {
  await requireUser();
  const [t, skills] = await Promise.all([getTranslations("Skills"), listSkills()]);
  if (skills.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.items")}</TableHead>
          <TableHead>
            <span className="sr-only">{t("columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skills.map((skill) => (
          <TableRow key={skill.id}>
            <TableCell className="font-medium">{skill.name}</TableCell>
            <TableCell>
              {skill.itemCount > 0 ? (
                <Link href={{ pathname: "/learning", query: { skillId: skill.id } }} className="hover:underline">
                  {t("items", { count: skill.itemCount })}
                </Link>
              ) : (
                <span className="text-muted-foreground">{t("items", { count: 0 })}</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <RenameSkillDialog skill={skill} />
                <DeleteSkillButton skill={skill} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
