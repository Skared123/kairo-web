import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** A task's or follow-up's job, linking to its page. */
export function JobLink({ job }: { job: { id: string; company: string; title: string } }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
    >
      {job.company} · {job.title}
    </Link>
  );
}

/** The secondary line: its parts joined by " · ", nothing when every part is empty. */
export function Meta({ children }: { children: ReactNode[] }) {
  const parts = children.filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  return (
    <span className="text-xs text-muted-foreground">
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && " · "}
          {part}
        </span>
      ))}
    </span>
  );
}
