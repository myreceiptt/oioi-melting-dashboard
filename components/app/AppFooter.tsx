"use client";

import { AppMenu } from "@/components/app/AppMenu";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export function AppFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-row gap-3 px-6 pb-5 items-center justify-between">
      <AppMenu />
      <ThemeSwitcher />
    </footer>
  );
}
