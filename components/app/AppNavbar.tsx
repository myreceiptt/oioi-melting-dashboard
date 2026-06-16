"use client";

import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useOioiTheme } from "@/components/theme/ThemeProvider";

export function AppNavbar() {
  const { switcherEnabled } = useOioiTheme();

  if (!switcherEnabled) {
    return null;
  }

  return (
    <nav className="mx-auto flex max-w-6xl justify-end px-6 pt-5">
      <ThemeSwitcher />
    </nav>
  );
}
