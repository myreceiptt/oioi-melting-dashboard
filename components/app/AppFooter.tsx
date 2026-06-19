"use client";

import { AppCopyright } from "@/components/app/AppCopyright";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export function AppFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-row items-center justify-between gap-3 px-6 pb-5">
      <AppCopyright />
      <ThemeSwitcher />
    </footer>
  );
}
