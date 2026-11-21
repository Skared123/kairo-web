"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ValidationMessages } from "./auth-schemas";

/** The current language's validation messages, for the form schemas. */
export function useValidationMessages(): ValidationMessages {
  const t = useTranslations("Validation");
  return useMemo(
    () => ({ required: t("required"), email: t("email"), tooLong: (max: number) => t("tooLong", { max }) }),
    [t],
  );
}
