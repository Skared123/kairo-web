"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import type { JobFilters } from "@/lib/api/jobs";

/** Searches by company or title, keeping the current stage and sorting. */
export function SearchBox({ filters }: { filters: JobFilters }) {
  const t = useTranslations("Jobs.search");
  const router = useRouter();
  const id = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push({ pathname: "/jobs", query: { ...filters, q: q || undefined } });
  }

  return (
    <form role="search" onSubmit={onSubmit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <Input id={id} name="q" type="search" defaultValue={filters.q} placeholder={t("label")} className="w-64" />
      <Button type="submit" variant="outline" size="icon" aria-label={t("submit")}>
        <Search aria-hidden />
      </Button>
    </form>
  );
}
