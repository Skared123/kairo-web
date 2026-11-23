import { Check, CircleHelp, Minus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Job } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Match = NonNullable<Job["criteria"][keyof Job["criteria"]]>;

const ICONS = { meets: Check, misses: X, unknown: CircleHelp, not_comparable: Minus } satisfies Record<Match, unknown>;

const STYLES: Record<Match, string> = {
  meets: "text-emerald-700 dark:text-emerald-400",
  misses: "text-destructive",
  unknown: "text-muted-foreground",
  not_comparable: "text-muted-foreground",
};

/** How a job compares with each criterion the user set (API decision 029). Criteria not set are left out. */
export function CriteriaBadges({ criteria }: { criteria: Job["criteria"] }) {
  const t = useTranslations("Jobs");
  const entries = (["salary", "remote", "contract"] as const).flatMap((name) => {
    const match = criteria[name];
    return match ? [{ name, match }] : [];
  });
  if (entries.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {entries.map(({ name, match }) => {
        const Icon = ICONS[match];
        return (
          <li key={name} className={cn("flex items-center gap-1", STYLES[match])}>
            <Icon className="size-3.5" aria-hidden />
            <span>
              {t(`criteria.${name}`)}: {t(`match.${match}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
