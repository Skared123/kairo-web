import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Next.js' navigation helpers, aware of the locale prefix. Use these instead of next/link and next/navigation. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
