import type { routing } from "./i18n/routing";
import type messages from "./messages/es.json";

// Types next-intl with the app's locales and messages: a misspelled key or locale does not compile (decision 023).
// Spanish is the reference; en.json must have the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
