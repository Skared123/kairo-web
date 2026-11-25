import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** A link inside a Today line, underlined lightly so it reads as one without shouting. */
export function ItemLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
    >
      {children}
    </Link>
  );
}

/** A task's job, linking to its page. */
export function JobLink({ job }: { job: { id: string; company: string; title: string } }) {
  return (
    <ItemLink href={`/jobs/${job.id}`}>
      {job.company} · {job.title}
    </ItemLink>
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
