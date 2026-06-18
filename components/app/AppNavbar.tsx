"use client";

import { AppMenu } from "@/components/app/AppMenu";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export function AppNavbar() {
  return (
    <nav className="mx-auto flex max-w-6xl flex-row gap-3 px-6 pt-5 items-center justify-between">
      <AppMenu />
      <ThemeSwitcher />
    </nav>
  );
}
