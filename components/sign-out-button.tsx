"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";

/** Ends this browser's session, then goes to sign-in. */
export function SignOutButton() {
  const t = useTranslations("AppHeader");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      // 204, or 401 when the session had already ended: either way there is no session left.
      await browserApi.POST("/auth/sign-out");
    } finally {
      router.replace("/sign-in");
      router.refresh();
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} disabled={pending}>
      <LogOut aria-hidden />
      {pending ? t("signingOut") : t("signOut")}
    </Button>
  );
}
