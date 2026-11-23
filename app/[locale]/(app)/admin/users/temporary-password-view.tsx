"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Shows a temporary password once, with a copy button (API decisions 017 and 026). */
export function TemporaryPasswordView({ name, password, onDone }: { name: string; password: string; onDone: () => void }) {
  const t = useTranslations("Admin.temporaryPassword");
  const [copied, setCopied] = useState(false);
  const code = useRef<HTMLElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // The browser refused the clipboard: select the password so Cmd/Ctrl+C copies it.
      if (code.current) {
        window.getSelection()?.selectAllChildren(code.current);
      }
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description", { name })}</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <code ref={code} className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-lg tracking-wider">{password}</code>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <DialogFooter>
        <Button onClick={onDone}>{t("done")}</Button>
      </DialogFooter>
    </>
  );
}
