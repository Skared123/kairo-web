import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/api/types";

/** A job's stage, with a quieter look for the stages where the job is over. */
export function JobStatusBadge({ status }: { status: JobStatus }) {
  const t = useTranslations("JobStatus");
  const closed = status === "rejected" || status === "discarded";
  return <Badge variant={closed ? "outline" : status === "accepted" ? "default" : "secondary"}>{t(status)}</Badge>;
}
