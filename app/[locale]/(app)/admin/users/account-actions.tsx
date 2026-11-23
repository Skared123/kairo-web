"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { browserApi } from "@/lib/api/browser";
import type { Account } from "@/lib/api/types";
import { TemporaryPasswordView } from "./temporary-password-view";

type Action = "makeAdmin" | "makeUser" | "deactivate" | "reactivate" | "resetPassword";

/** The row's menu. Every action asks for confirmation first; the API's answer decides (last admin, missing account). */
export function AccountActions({ account }: { account: Account }) {
  const t = useTranslations("Admin");
  const validation = useTranslations("Validation");
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function choose(next: Action) {
    setError(null);
    setAction(next);
  }

  async function confirm() {
    if (!action) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await run(action, account.id);
      if (response.ok) {
        setAction(null);
        router.refresh();
        return;
      }
      setError(
        response.status === 409
          ? t("errors.lastAdmin")
          : response.status === 404
            ? t("errors.notFound")
            : validation("unexpected"),
      );
    } catch {
      setError(validation("unexpected"));
    } finally {
      setPending(false);
    }
  }

  /** Calls the API for one action; a reset also keeps the new temporary password to show it once. */
  async function run(chosen: Action, id: string): Promise<Response> {
    const path = { params: { path: { id } } };
    if (chosen === "resetPassword") {
      const { data, response } = await browserApi.POST("/admin/users/{id}/password", path);
      if (data) {
        setTemporaryPassword(data.temporaryPassword);
      }
      return response;
    }
    const body =
      chosen === "makeAdmin"
        ? { role: "admin" as const }
        : chosen === "makeUser"
          ? { role: "user" as const }
          : { active: chosen === "reactivate" };
    return (await browserApi.PATCH("/admin/users/{id}", { ...path, body })).response;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("actions.menu", { name: account.name })}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => choose(account.role === "admin" ? "makeUser" : "makeAdmin")}>
            {account.role === "admin" ? t("actions.makeUser") : t("actions.makeAdmin")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => choose("resetPassword")}>{t("actions.resetPassword")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          {account.active ? (
            <DropdownMenuItem variant="destructive" onSelect={() => choose("deactivate")}>
              {t("actions.deactivate")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => choose("reactivate")}>{t("actions.reactivate")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={action !== null} onOpenChange={(open) => !open && !pending && setAction(null)}>
        {action && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t(`confirm.${action}.title`, { name: account.name })}</AlertDialogTitle>
              <AlertDialogDescription>{t(`confirm.${action}.description`)}</AlertDialogDescription>
            </AlertDialogHeader>
            {error && <FieldError>{error}</FieldError>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>{t("confirm.cancel")}</AlertDialogCancel>
              {/* A plain button, not AlertDialogAction: the dialog stays open while saving and when the API refuses. */}
              <Button
                variant={action === "deactivate" ? "destructive" : "default"}
                onClick={confirm}
                disabled={pending}
              >
                {pending ? t("confirm.working") : t("confirm.submit")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <Dialog open={temporaryPassword !== null} onOpenChange={(open) => !open && setTemporaryPassword(null)}>
        <DialogContent>
          {temporaryPassword && (
            <TemporaryPasswordView
              name={account.name}
              password={temporaryPassword}
              onDone={() => setTemporaryPassword(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
