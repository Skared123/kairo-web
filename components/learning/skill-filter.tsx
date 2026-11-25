"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import type { Skill } from "@/lib/api/types";

const ALL = "__all__";

/** Filters the learning list by one skill, keeping the status tab. */
export function SkillFilter({
  skills,
  query,
}: {
  skills: Skill[];
  query: { status?: string; skillId?: string };
}) {
  const t = useTranslations("Learning.skillFilter");
  const router = useRouter();
  return (
    <Select
      value={query.skillId ?? ALL}
      onValueChange={(value) =>
        router.push({ pathname: "/learning", query: { ...query, skillId: value === ALL ? undefined : value } })
      }
    >
      <SelectTrigger aria-label={t("label")} className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t("all")}</SelectItem>
        {skills.map((skill) => (
          <SelectItem key={skill.id} value={skill.id}>
            {skill.name} ({skill.itemCount})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
