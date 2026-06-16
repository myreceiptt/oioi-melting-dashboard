"use client";

import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useOioiTheme } from "@/components/theme/ThemeProvider";

export function AppFooter() {
  const { switcherEnabled } = useOioiTheme();

  if (!switcherEnabled) {
    return null;
  }

  return (
    <footer className="mx-auto flex max-w-6xl justify-end px-6 pb-6 pt-2">
      <ThemeSwitcher />
    </footer>
  );
}
