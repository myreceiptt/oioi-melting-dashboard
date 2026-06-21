export type OioiTheme = "base" | "deth";

export type ThemeMode = {
  forcedTheme: OioiTheme | null;
  switcherEnabled: boolean;
};

const chainRouteRules: Array<{ pattern: RegExp; theme: OioiTheme }> = [
  { pattern: /^\/dashboard\/base(?:\/|$)/, theme: "base" },
  { pattern: /^\/admin\/base(?:\/|$)/, theme: "base" },
  { pattern: /^\/mint\/[^/]+\/base(?:\/|$)/, theme: "base" },
  { pattern: /^\/dashboard\/ethereum(?:\/|$)/, theme: "deth" },
  { pattern: /^\/admin\/ethereum(?:\/|$)/, theme: "deth" },
  { pattern: /^\/mint\/[^/]+\/ethereum(?:\/|$)/, theme: "deth" },
];

export function getThemeMode(pathname: string): ThemeMode {
  const matchedRule = chainRouteRules.find(({ pattern }) =>
    pattern.test(pathname),
  );

  if (matchedRule) {
    return {
      forcedTheme: matchedRule.theme,
      switcherEnabled: false,
    };
  }

  return {
    forcedTheme: null,
    switcherEnabled:
      pathname === "/" ||
      pathname === "/mint" ||
      /^\/mint\/[^/]+(?:\/[^/]+)?$/.test(pathname) ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/admin" ||
      pathname.startsWith("/admin/"),
  };
}
