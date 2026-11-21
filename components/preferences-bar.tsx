import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitch } from "./theme-switch";

/** Language and theme, available on every screen. */
export function PreferencesBar() {
  return (
    <div className="flex items-center justify-end gap-4 p-4">
      <LocaleSwitcher />
      <ThemeSwitch />
    </div>
  );
}
