import type { ReactNode } from "react";
import { PreferencesBar } from "@/components/preferences-bar";

/** Sign-in and first-run setup: no session yet, only the language and theme controls. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreferencesBar />
      {children}
    </>
  );
}
