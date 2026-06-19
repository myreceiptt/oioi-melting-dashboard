"use client";

import { AppMenu } from "@/components/app/AppMenu";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export function AppNavbar() {
  return (
    <nav className="mx-auto flex w-full max-w-6xl flex-row items-center justify-between gap-3 px-6 pt-5">
      <AppMenu />
      <ThemeSwitcher />
    </nav>
  );
}
