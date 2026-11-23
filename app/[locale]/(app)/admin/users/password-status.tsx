"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { ClientDate } from "@/components/client-date";
import { Badge } from "@/components/ui/badge";
import type { Account } from "@/lib/api/types";

type PasswordFields = Pick<Account, "mustChangePassword" | "temporaryPasswordExpiresAt">;

const subscribe = () => () => {};

/** Whether the account uses its own password or a temporary one, and when that one expires (API decision 026). */
export function PasswordStatus({ account }: { account: PasswordFields }) {
  const t = useTranslations("Admin.password");
  // Expiry depends on the current time, which only the browser may read (Cache Components): mount it there.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!account.mustChangePassword || !account.temporaryPasswordExpiresAt) {
    return <Badge variant="outline">{t("own")}</Badge>;
  }
  return mounted ? <TemporaryPasswordBadge expiresAt={account.temporaryPasswordExpiresAt} /> : null;
}

function TemporaryPasswordBadge({ expiresAt }: { expiresAt: string }) {
  const t = useTranslations("Admin.password");
  // Read once when the badge mounts; router.refresh() after any change mounts it again.
  const [now] = useState(() => Date.now());

  if (new Date(expiresAt).getTime() <= now) {
    return <Badge variant="destructive">{t("expired")}</Badge>;
  }
  return (
    <Badge variant="secondary">
      {t("pending")} <ClientDate value={expiresAt} />
    </Badge>
  );
}
