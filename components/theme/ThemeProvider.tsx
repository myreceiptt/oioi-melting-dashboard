"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { getEffectivePathname } from "@/lib/app/surfaceRoutes";
import { getThemeMode, type OioiTheme } from "./themeRules";

const THEME_STORAGE_KEY = "oioi-estetika-theme";

type ThemeContextValue = {
  activeTheme: OioiTheme;
  forcedTheme: OioiTheme | null;
  switcherEnabled: boolean;
  setTheme: (theme: OioiTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): OioiTheme {
  if (typeof window === "undefined") {
    return "base";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "deth" ? "deth" : "base";
}

function readClientHost() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selectedTheme, setSelectedTheme] =
    useState<OioiTheme>(readStoredTheme);
  const [currentHost, setCurrentHost] = useState(readClientHost);
  const [hasMounted, setHasMounted] = useState(false);

  const effectivePathname = useMemo(
    () => getEffectivePathname(currentHost, pathname),
    [currentHost, pathname],
  );
  const themeMode = useMemo(
    () => getThemeMode(effectivePathname),
    [effectivePathname],
  );
  const activeTheme = themeMode.forcedTheme ?? selectedTheme;

  useEffect(() => {
    setCurrentHost(window.location.hostname);
    setHasMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.oioiTheme = activeTheme;
  }, [activeTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      activeTheme,
      forcedTheme: themeMode.forcedTheme,
      switcherEnabled: themeMode.switcherEnabled && hasMounted,
      setTheme: (theme) => {
        setSelectedTheme(theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      },
    }),
    [activeTheme, hasMounted, themeMode.forcedTheme, themeMode.switcherEnabled],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useOioiTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useOioiTheme must be used inside ThemeProvider.");
  }

  return context;
}
