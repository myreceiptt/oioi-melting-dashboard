"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  getEffectivePathname,
  getMainAppHref,
  getMintSurfaceByHost,
  getMintSurfaceHref,
  MINT_SURFACES,
  type MintSurface,
} from "@/lib/app/surfaceRoutes";
import { isExpectedAdminOwner } from "@/lib/admin/adminOwner";
import {
  LORE_LANGUAGES,
  type LoreLanguageCode,
} from "@/lib/lore/loreLanguages";

type LinkTarget = "_blank" | "_self";

type MenuLink = {
  activePath?: string;
  href: string;
  label: string;
  target?: LinkTarget;
};

type MenuGroup = {
  activePath?: string;
  label: string;
  href?: string;
  target?: LinkTarget;
  children: Array<MenuLink | MenuGroup>;
};

type MenuItem = MenuLink | MenuGroup;

const LORE_MENU_SURFACES = [
  {
    href: "/lore#lore-surface-1-1",
    label: "In The 0101 Universe...",
    chapters: [
      {
        label: "Pseudonymous Invitations",
        slug: "pseudonymous-invitations",
      },
      {
        label: "The Melting Date",
        slug: "the-melting-date",
      },
      {
        label: "The Melting Journey",
        slug: "the-melting-journey",
      },
      {
        label: "The Melting Archipelago",
        slug: "the-melting-archipelago",
      },
      {
        label: "The Melting BOMB",
        slug: "the-melting-bomb",
      },
      {
        label: "The Melting Rabbit",
        slug: "the-melting-rabbit",
      },
      {
        label: "The Melting Pigs",
        slug: "the-melting-pigs",
      },
      {
        label: "The Melting Armor",
        slug: "the-melting-armor",
      },
      {
        label: "The Melting Satans",
        slug: "the-melting-satans",
      },
      {
        label: "The Melting Money",
        slug: "the-melting-money",
      },
    ],
  },
  {
    href: "/lore#lore-surface-2-1",
    label: "In The Universe of Reality...",
    chapters: [
      {
        label: "The Melting Conservation",
        slug: "the-melting-conservation",
      },
    ],
  },
  {
    href: "/lore#lore-surface-3-1",
    label: "Back to The 0101 Universes...",
    chapters: [
      {
        label: "The Farmers of BANANOW LAND",
        slug: "the-farmers-of-bananow-land",
      },
      {
        label: "The Anti-Forked Currency",
        slug: "the-anti-forked-currency",
      },
      {
        label: "Those Who Did Not Survive",
        slug: "those-who-did-not-survive",
      },
      {
        label: "The Highly Programmable Money",
        slug: "the-highly-programmable-money",
      },
      {
        label: "Acceptance and Moving Forward",
        slug: "acceptance-and-moving-forward",
      },
      {
        label: "Happy Life of Fair Family",
        slug: "happy-life-of-fair-family",
      },
    ],
  },
] as const;

function readClientHost() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname;
}

function getLoreLanguage(value: string | null): LoreLanguageCode {
  return LORE_LANGUAGES.some((language) => language.code === value)
    ? (value as LoreLanguageCode)
    : "en";
}

function readClientLoreLanguage(): LoreLanguageCode {
  if (typeof window === "undefined") {
    return "en";
  }

  return getLoreLanguage(
    new URLSearchParams(window.location.search).get("lang"),
  );
}

function getAppHref(pathname: string, useMainAppOrigin: boolean) {
  return useMainAppOrigin ? getMainAppHref(pathname) : pathname;
}

function getLoreHref(
  pathname: string,
  language: LoreLanguageCode,
  useMainAppOrigin: boolean,
) {
  const [path, hash = ""] = pathname.split("#");
  const separator = path.includes("?") ? "&" : "?";
  const localizedPath = `${path}${separator}lang=${language}${
    hash ? `#${hash}` : ""
  }`;

  return getAppHref(localizedPath, useMainAppOrigin);
}

function getAppTarget(useMainAppOrigin: boolean): LinkTarget {
  return useMainAppOrigin ? "_blank" : "_self";
}

function getMintHref(surface: MintSurface, currentSurface: MintSurface | null) {
  return currentSurface?.host === surface.host
    ? "/"
    : getMintSurfaceHref(surface);
}

function getMintAnchorHref(
  surface: MintSurface,
  currentSurface: MintSurface | null,
  hash: "#mint-card" | "#soft-staking",
) {
  return currentSurface?.host === surface.host
    ? `/${hash}`
    : getMintSurfaceHref(surface, `/${hash}`);
}

function getMintTarget(
  surface: MintSurface,
  currentSurface: MintSurface | null,
): LinkTarget {
  return currentSurface?.host === surface.host ? "_self" : "_blank";
}

function buildMintChildren(currentSurface: MintSurface | null): MenuGroup[] {
  return MINT_SURFACES.map((surface) => {
    const target = getMintTarget(surface, currentSurface);

    return {
      activePath: surface.pathname,
      href: getMintHref(surface, currentSurface),
      label: surface.label,
      target,
      children: [
        {
          href: getMintAnchorHref(surface, currentSurface, "#mint-card"),
          label: "Mint NFT",
          target,
        },
        {
          href: getMintAnchorHref(surface, currentSurface, "#soft-staking"),
          label: "Soft Staking",
          target,
        },
      ],
    };
  });
}

function buildLoreChildren(
  language: LoreLanguageCode,
  useMainAppOrigin: boolean,
): MenuGroup[] {
  const target = getAppTarget(useMainAppOrigin);

  return LORE_MENU_SURFACES.map((surface) => ({
    href: getLoreHref(surface.href, language, useMainAppOrigin),
    label: surface.label,
    target,
    children: surface.chapters.map((chapter) => ({
      activePath: `/lore/chapter/${chapter.slug}`,
      href: getLoreHref(
        `/lore/chapter/${chapter.slug}`,
        language,
        useMainAppOrigin,
      ),
      label: chapter.label,
      target,
    })),
  }));
}

function buildDashboardChildren(useMainAppOrigin: boolean): MenuGroup[] {
  const target = getAppTarget(useMainAppOrigin);

  return [
    {
      activePath: "/dashboard/base",
      href: getAppHref("/dashboard/base", useMainAppOrigin),
      label: "BASE Dashboard",
      target,
      children: [
        {
          href: getAppHref("/dashboard/base#read-panel", useMainAppOrigin),
          label: "Staking Summary",
          target,
        },
        {
          href: getAppHref("/dashboard/base#soft-staking", useMainAppOrigin),
          label: "Soft Staking",
          target,
        },
        {
          href: getAppHref("/dashboard/base#reward-claim", useMainAppOrigin),
          label: "Staking Reward",
          target,
        },
      ],
    },
    {
      activePath: "/dashboard/ethereum",
      href: getAppHref("/dashboard/ethereum", useMainAppOrigin),
      label: "dETH Dashboard",
      target,
      children: [
        {
          href: getAppHref("/dashboard/ethereum#read-panel", useMainAppOrigin),
          label: "Staking Summary",
          target,
        },
        {
          href: getAppHref(
            "/dashboard/ethereum#soft-staking",
            useMainAppOrigin,
          ),
          label: "Soft Staking",
          target,
        },
        {
          href: getAppHref(
            "/dashboard/ethereum#reward-claim",
            useMainAppOrigin,
          ),
          label: "Staking Reward",
          target,
        },
      ],
    },
  ];
}

function buildAdminChildren(useMainAppOrigin: boolean): MenuGroup[] {
  const target = getAppTarget(useMainAppOrigin);

  return [
    {
      activePath: "/admin/base",
      href: getAppHref("/admin/base", useMainAppOrigin),
      label: "BASE Admin",
      target,
      children: [
        {
          href: getAppHref("/admin/base#contract-list", useMainAppOrigin),
          label: "Contract List",
          target,
        },
        {
          href: getAppHref("/admin/base#read-contract", useMainAppOrigin),
          label: "Read Contract",
          target,
        },
        {
          href: getAppHref("/admin/base#registry-controls", useMainAppOrigin),
          label: "Staking Registry",
          target,
        },
        {
          href: getAppHref("/admin/base#phase-controls", useMainAppOrigin),
          label: "Mint Phase",
          target,
        },
        {
          href: getAppHref("/admin/base#money-controls", useMainAppOrigin),
          label: "Price & Royalty",
          target,
        },
        {
          href: getAppHref("/admin/base#metadata-controls", useMainAppOrigin),
          label: "Metadata Controls",
          target,
        },
        {
          href: getAppHref("/admin/base#round-controls", useMainAppOrigin),
          label: "Reward Round",
          target,
        },
        {
          href: getAppHref("/admin/base#rescue-controls", useMainAppOrigin),
          label: "Emergency Rescue",
          target,
        },
      ],
    },
    {
      activePath: "/admin/ethereum",
      href: getAppHref("/admin/ethereum", useMainAppOrigin),
      label: "dETH Admin",
      target,
      children: [
        {
          href: getAppHref("/admin/ethereum#contract-list", useMainAppOrigin),
          label: "Contract List",
          target,
        },
        {
          href: getAppHref("/admin/ethereum#read-contract", useMainAppOrigin),
          label: "Read Contract",
          target,
        },
        {
          href: getAppHref(
            "/admin/ethereum#registry-controls",
            useMainAppOrigin,
          ),
          label: "Staking Registry",
          target,
        },
        {
          href: getAppHref("/admin/ethereum#phase-controls", useMainAppOrigin),
          label: "Mint Phase",
          target,
        },
        {
          href: getAppHref("/admin/ethereum#money-controls", useMainAppOrigin),
          label: "Price & Royalty",
          target,
        },
        {
          href: getAppHref(
            "/admin/ethereum#metadata-controls",
            useMainAppOrigin,
          ),
          label: "Metadata Controls",
          target,
        },
        {
          href: getAppHref("/admin/ethereum#round-controls", useMainAppOrigin),
          label: "Reward Round",
          target,
        },
        {
          href: getAppHref("/admin/ethereum#rescue-controls", useMainAppOrigin),
          label: "Emergency Rescue",
          target,
        },
      ],
    },
  ];
}

function buildMenuItems(
  currentSurface: MintSurface | null,
  loreLanguage: LoreLanguageCode,
  showAdminMenu: boolean,
): MenuItem[] {
  const useMainAppOrigin = currentSurface !== null;
  const appTarget = getAppTarget(useMainAppOrigin);

  const items: MenuItem[] = [
    {
      activePath: useMainAppOrigin ? undefined : "/",
      href: getAppHref("/", useMainAppOrigin),
      label: "Home",
      target: appTarget,
    },
    {
      activePath: "/lore",
      href: getLoreHref("/lore", loreLanguage, useMainAppOrigin),
      label: "Lore",
      target: appTarget,
      children: buildLoreChildren(loreLanguage, useMainAppOrigin),
    },
    {
      activePath: "/mint",
      label: "Mint",
      children: buildMintChildren(currentSurface),
    },
    {
      activePath: "/dashboard",
      href: getAppHref("/dashboard", useMainAppOrigin),
      label: "Dashboard",
      target: appTarget,
      children: buildDashboardChildren(useMainAppOrigin),
    },
  ];

  if (showAdminMenu) {
    items.push({
      activePath: "/admin",
      href: getAppHref("/admin", useMainAppOrigin),
      label: "Admin",
      target: appTarget,
      children: buildAdminChildren(useMainAppOrigin),
    });
  }

  return items;
}

function hasChildren(item: MenuItem): item is MenuGroup {
  return "children" in item;
}

function getItemActivePath(item: MenuItem) {
  return item.activePath ?? item.href;
}

function isActivePath(pathname: string, activePath: string | undefined) {
  if (!activePath) {
    return false;
  }

  if (activePath === "/") {
    return pathname === "/";
  }

  return pathname === activePath || pathname.startsWith(`${activePath}/`);
}

function groupIsActive(pathname: string, item: MenuItem): boolean {
  if (isActivePath(pathname, getItemActivePath(item))) {
    return true;
  }

  if (!hasChildren(item)) {
    return false;
  }

  return item.children.some((child) => groupIsActive(pathname, child));
}

function MenuLinkItem({
  isActive = false,
  item,
  onNavigate,
  size = "regular",
}: {
  isActive?: boolean;
  item: MenuLink;
  onNavigate?: () => void;
  size?: "regular" | "small";
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`block rounded-xl transition ${
        isActive
          ? "bg-white text-black"
          : "bg-black text-white hover:bg-(--oioi-accent)"
      } ${
        size === "small"
          ? "px-3 py-2 text-xs"
          : "px-4 py-2 text-sm font-semibold"
      }`}
      href={item.href}
      onClick={onNavigate}
      rel={item.target === "_blank" ? "noreferrer" : undefined}
      target={item.target}>
      {item.label}
    </Link>
  );
}

export function AppMenu() {
  const pathname = usePathname();
  const { address } = useAccount();
  const navRef = useRef<HTMLElement | null>(null);
  const [currentHost, setCurrentHost] = useState("");
  const [loreLanguage, setLoreLanguage] = useState<LoreLanguageCode>("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null);

  const currentSurface = useMemo(
    () => getMintSurfaceByHost(currentHost),
    [currentHost],
  );
  const effectivePathname = useMemo(
    () => getEffectivePathname(currentHost, pathname),
    [currentHost, pathname],
  );
  const showAdminMenu = isExpectedAdminOwner(address);
  const menuItems = useMemo(
    () => buildMenuItems(currentSurface, loreLanguage, showAdminMenu),
    [currentSurface, loreLanguage, showAdminMenu],
  );

  function closeMobileMenu() {
    setMobileOpen(false);
    setOpenMobileGroup(null);
  }

  function closeDesktopMenu() {
    setOpenDesktopGroup(null);
  }

  useEffect(() => {
    setCurrentHost(readClientHost());
    setLoreLanguage(readClientLoreLanguage());
  }, []);

  useEffect(() => {
    function handleLoreLanguageChange(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      setLoreLanguage(getLoreLanguage(String(event.detail?.language ?? "")));
    }

    function handleHistoryChange() {
      setLoreLanguage(readClientLoreLanguage());
    }

    window.addEventListener(
      "oioi:lore-language-change",
      handleLoreLanguageChange,
    );
    window.addEventListener("popstate", handleHistoryChange);

    return () => {
      window.removeEventListener(
        "oioi:lore-language-change",
        handleLoreLanguageChange,
      );
      window.removeEventListener("popstate", handleHistoryChange);
    };
  }, []);

  useEffect(() => {
    closeMobileMenu();
    closeDesktopMenu();
  }, [effectivePathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        closeMobileMenu();
        closeDesktopMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeDesktopMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav aria-label="Main menu" className="relative" ref={navRef}>
      <div className="rounded-2xl border border-white/10 bg-black p-1 md:hidden">
        <button
          aria-expanded={mobileOpen}
          aria-label="Open main menu"
          className="inline-flex cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-(--oioi-accent)"
          onClick={() => setMobileOpen((current) => !current)}
          type="button">
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(82vw,360px)] rounded-2xl border border-white/10 bg-black p-1 shadow-2xl md:hidden">
          <div className="grid gap-2">
            {menuItems.map((item) => {
              const isActive = groupIsActive(effectivePathname, item);

              if (!hasChildren(item)) {
                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-black"
                        : "bg-black text-white hover:bg-(--oioi-accent)"
                    }`}
                    href={item.href}
                    rel={item.target === "_blank" ? "noreferrer" : undefined}
                    target={item.target}
                    key={item.label}
                    onClick={closeMobileMenu}>
                    {item.label}
                  </Link>
                );
              }

              const groupOpen = openMobileGroup === item.label;

              return (
                <div key={item.label}>
                  <button
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-black"
                        : "bg-black text-white hover:bg-(--oioi-accent)"
                    }`}
                    onClick={() =>
                      setOpenMobileGroup((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                    type="button">
                    <span>{item.label}</span>
                    <span>{groupOpen ? "-" : "+"}</span>
                  </button>

                  {groupOpen ? (
                    <div className="grid gap-2 rounded-xl p-2">
                      {item.href ? (
                        <MenuLinkItem
                          isActive={isActivePath(
                            effectivePathname,
                            getItemActivePath(item),
                          )}
                          item={{
                            activePath: item.activePath,
                            href: item.href,
                            label: `${item.label} Home`,
                            target: item.target,
                          }}
                          onNavigate={closeMobileMenu}
                          size="small"
                        />
                      ) : null}

                      {item.children.map((child) =>
                        hasChildren(child) ? (
                          <div key={child.label}>
                            {child.href ? (
                              <MenuLinkItem
                                isActive={isActivePath(
                                  effectivePathname,
                                  getItemActivePath(child),
                                )}
                                item={{
                                  activePath: child.activePath,
                                  href: child.href,
                                  label: child.label,
                                  target: child.target,
                                }}
                                onNavigate={closeMobileMenu}
                                size="small"
                              />
                            ) : (
                              <div className="px-3 py-2 text-xs font-semibold text-white">
                                {child.label}
                              </div>
                            )}

                            <div className="mt-2 grid gap-1 pl-3">
                              {child.children.map((nested) =>
                                hasChildren(nested) ? null : (
                                  <MenuLinkItem
                                    isActive={isActivePath(
                                      effectivePathname,
                                      getItemActivePath(nested),
                                    )}
                                    item={nested}
                                    key={nested.href}
                                    onNavigate={closeMobileMenu}
                                    size="small"
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <MenuLinkItem
                            isActive={isActivePath(
                              effectivePathname,
                              getItemActivePath(child),
                            )}
                            item={child}
                            key={child.href}
                            onNavigate={closeMobileMenu}
                            size="small"
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="hidden rounded-2xl border border-white/10 bg-black p-1 md:inline-flex md:gap-1">
        {menuItems.map((item) => {
          const isActive = groupIsActive(effectivePathname, item);

          if (!hasChildren(item)) {
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-black"
                    : "bg-black text-white hover:bg-(--oioi-accent)"
                }`}
                href={item.href}
                rel={item.target === "_blank" ? "noreferrer" : undefined}
                target={item.target}
                key={item.label}>
                {item.label}
              </Link>
            );
          }

          return (
            <div className="relative" key={item.label}>
              <button
                aria-expanded={openDesktopGroup === item.label}
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-black"
                    : "bg-black text-white hover:bg-(--oioi-accent)"
                }`}
                onClick={() =>
                  setOpenDesktopGroup((current) =>
                    current === item.label ? null : item.label,
                  )
                }
                type="button">
                {item.label}
              </button>

              {openDesktopGroup === item.label ? (
                <div className="absolute left-0 top-full z-50 min-w-64 pt-2">
                  <div className="grid gap-1 rounded-2xl border border-white/10 bg-black p-1 shadow-2xl">
                    {item.href ? (
                      <MenuLinkItem
                        isActive={isActivePath(
                          effectivePathname,
                          getItemActivePath(item),
                        )}
                        item={{
                          activePath: item.activePath,
                          href: item.href,
                          label: `${item.label} Home`,
                          target: item.target,
                        }}
                        onNavigate={closeDesktopMenu}
                        size="small"
                      />
                    ) : null}

                    {item.children.map((child) =>
                      hasChildren(child) ? (
                        <div key={child.label}>
                          {child.href ? (
                            <MenuLinkItem
                              isActive={isActivePath(
                                effectivePathname,
                                getItemActivePath(child),
                              )}
                              item={{
                                activePath: child.activePath,
                                href: child.href,
                                label: child.label,
                                target: child.target,
                              }}
                              onNavigate={closeDesktopMenu}
                              size="small"
                            />
                          ) : (
                            <div className="px-3 py-2 text-xs font-semibold text-white">
                              {child.label}
                            </div>
                          )}

                          <div className="mt-1 grid pl-3">
                            {child.children.map((nested) =>
                              hasChildren(nested) ? null : (
                                <MenuLinkItem
                                  isActive={isActivePath(
                                    effectivePathname,
                                    getItemActivePath(nested),
                                  )}
                                  item={nested}
                                  key={nested.href}
                                  onNavigate={closeDesktopMenu}
                                  size="small"
                                />
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <MenuLinkItem
                          isActive={isActivePath(
                            effectivePathname,
                            getItemActivePath(child),
                          )}
                          item={child}
                          key={child.href}
                          onNavigate={closeDesktopMenu}
                          size="small"
                        />
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
