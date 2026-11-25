"use client";

import { useSyncExternalStore } from "react";
import { localDay } from "./today";

const subscribe = () => () => {};

/**
 * Today in the browser, as YYYY-MM-DD (API decision 035); null on the server, which does not know the user's day.
 * A component that needs it renders nothing until it is known.
 */
export function useBrowserDay(): string | null {
  return useSyncExternalStore(subscribe, () => localDay(new Date()), () => null);
}
