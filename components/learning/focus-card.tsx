import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Focus } from "@/lib/api/types";

/** The study item the user marked as their focus, under Today's date (API decision 042). Nothing without one. */
export function FocusCard({ focus }: { focus: Focus }) {
  const t = useTranslations("Today.focus");
  const kinds = useTranslations("LearningKind");
  const statuses = useTranslations("LearningStatus");
  const id = useId();
  if (!focus) {
    return null;
  }
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="text-sm font-medium text-muted-foreground">
        {t("title")}
      </h2>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {focus.url ? (
            <a
              href={focus.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium hover:underline"
            >
              {focus.title}
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </a>
          ) : (
            <span className="font-medium">{focus.title}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {kinds(focus.kind)} · {statuses(focus.status)}
          </span>
          {focus.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {focus.skills.map((skill) => (
                <Badge key={skill.id} variant="outline">
                  {skill.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Link href="/learning" className="shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline">
          {t("link")}
        </Link>
      </div>
    </section>
  );
}
