"use client";

import { Search } from "lucide-react";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

/** A list's search: sends `q` to `pathname`, keeping the list's other filters in `query`. */
export function SearchBox({
  pathname,
  query,
  label,
  submitLabel,
}: {
  pathname: string;
  query: { q?: string } & Record<string, string | undefined>;
  label: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const id = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push({ pathname, query: { ...query, q: q || undefined } });
  }

  return (
    <form role="search" onSubmit={onSubmit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input id={id} name="q" type="search" defaultValue={query.q} placeholder={label} className="w-64" />
      <Button type="submit" variant="outline" size="icon" aria-label={submitLabel}>
        <Search aria-hidden />
      </Button>
    </form>
  );
}
