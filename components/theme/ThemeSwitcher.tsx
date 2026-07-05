"use client";

import clsx from "clsx";
import { useOioiTheme } from "./ThemeProvider";
import type { OioiTheme } from "./themeRules";

const themeOptions: Array<{ value: OioiTheme; label: string }> = [
  { value: "base", label: "BASE" },
  { value: "deth", label: "dETH" },
];

const themeButtonColor: Record<OioiTheme, string> = {
  base: "#0052ff",
  deth: "#800000",
};

export function ThemeSwitcher() {
  const { activeTheme, setTheme, switcherEnabled } = useOioiTheme();

  if (!switcherEnabled) {
    return null;
  }

  return (
    <div
      aria-label="ESTETIKA theme switcher"
      className="inline-flex gap-1 rounded-2xl border border-white/10 bg-black p-1"
      role="group"
    >
      {themeOptions.map((option) => {
        const isActive = activeTheme === option.value;
        const themeColor = themeButtonColor[option.value];

        return (
          <button
            aria-pressed={isActive}
            className={clsx(
              "theme-switcher-option rounded-xl px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "cursor-default text-white shadow-sm"
                : "cursor-pointer bg-black text-white hover:bg-(--oioi-theme-switcher-hover) hover:text-white",
            )}
            disabled={isActive}
            key={option.value}
            onClick={() => setTheme(option.value)}
            style={
              isActive
                ? { backgroundColor: themeColor }
                : ({
                    "--oioi-theme-switcher-hover": themeColor,
                  } as React.CSSProperties)
            }
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
