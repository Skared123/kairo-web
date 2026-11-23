"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { JobValidationMessages } from "./job-schema";

/** The current language's validation messages, for every form schema. */
export function useValidationMessages(): JobValidationMessages {
  const t = useTranslations("Validation");
  return useMemo(
    () => ({
      required: t("required"),
      email: t("email"),
      tooLong: (max: number) => t("tooLong", { max }),
      passwordsDontMatch: t("passwordsDontMatch"),
      samePassword: t("samePassword"),
      url: t("url"),
      wholeNumber: t("wholeNumber"),
      currency: t("currency"),
      salaryIncomplete: t("salaryIncomplete"),
      salaryRange: t("salaryRange"),
    }),
    [t],
  );
}
