"use client";

import { Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const subscribe = () => () => {};

/** Flips between light and dark. Until the user flips it, the theme follows the system (decision 025). */
export function ThemeSwitch() {
  const t = useTranslations("Preferences");
  const { resolvedTheme, setTheme } = useTheme();
  // Unique per instance: Next.js keeps previous pages mounted but hidden, so a fixed id could repeat.
  const id = useId();
  // The theme is only known in the browser: render the switch there, so the server and browser HTML match.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="flex items-center gap-2">
      <Moon className="size-4 text-muted-foreground" aria-hidden />
      <Label htmlFor={id} className="sr-only">
        {t("darkTheme")}
      </Label>
      <Switch
        id={id}
        checked={mounted && resolvedTheme === "dark"}
        disabled={!mounted}
        onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
      />
    </div>
  );
}
