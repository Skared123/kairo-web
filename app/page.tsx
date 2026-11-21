import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";

/** Placeholder home until the signed-in layout (step 4) and Today (v0.3). */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Kairo</h1>
      <p className="text-zinc-500">Job search companion.</p>
      {/* Reads the session, so it streams in after the rest of the page. */}
      <Suspense fallback={<p className="text-sm text-zinc-400">Checking your session…</p>}>
        <SessionStatus />
      </Suspense>
    </main>
  );
}

async function SessionStatus() {
  const user = await getCurrentUser();
  return (
    <p className="text-sm text-zinc-500">
      {user ? `Signed in as ${user.name} (${user.role})` : "Not signed in"}
    </p>
  );
}
