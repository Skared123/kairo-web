import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ClientDate } from "@/components/client-date";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAccounts } from "@/lib/api/accounts";
import { requireAdmin } from "@/lib/auth";
import { AccountActions } from "./account-actions";
import { CreateAccountDialog } from "./create-account-dialog";
import { PasswordStatus } from "./password-status";

/** Account management, for admins only (API decision 017). It lists accounts, never what users keep in the app. */
export default function AccountsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      {/* Everything waits for the role check, so nobody else ever sees the title or the "New account" button. */}
      <Suspense fallback={null}>
        <Accounts />
      </Suspense>
    </main>
  );
}

async function Accounts() {
  const t = await getTranslations("Admin");
  const me = await requireAdmin();
  const accounts = await listAccounts();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <CreateAccountDialog />
      </div>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.email")}</TableHead>
          <TableHead>{t("columns.role")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.password")}</TableHead>
          <TableHead>{t("columns.created")}</TableHead>
          <TableHead className="sr-only">{t("columns.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id} className={account.active ? undefined : "text-muted-foreground"}>
            <TableCell className="font-medium">
              {account.name}
              {account.id === me.id && <span className="ml-2 text-xs text-muted-foreground">({t("you")})</span>}
            </TableCell>
            <TableCell>{account.email}</TableCell>
            <TableCell>{t(`roles.${account.role}`)}</TableCell>
            <TableCell>
              <Badge variant={account.active ? "outline" : "secondary"}>
                {account.active ? t("status.active") : t("status.inactive")}
              </Badge>
            </TableCell>
            <TableCell>
              <PasswordStatus account={account} />
            </TableCell>
            <TableCell>
              <ClientDate value={account.createdAt} />
            </TableCell>
            <TableCell className="text-right">
              <AccountActions account={account} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </>
  );
}
