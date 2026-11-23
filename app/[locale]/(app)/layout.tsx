import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

/**
 * Every page that needs a session. proxy.ts already sent guests without a session cookie to sign-in; the header's
 * requireUser() catches a cookie whose session ended.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
