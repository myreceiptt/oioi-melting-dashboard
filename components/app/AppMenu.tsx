"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MenuLink = {
  href: string;
  label: string;
  target?: "_blank";
};

type MenuGroup = {
  label: string;
  href?: string;
  children: Array<MenuLink | MenuGroup>;
};

type MenuItem = MenuLink | MenuGroup;

const dashboardChildren: MenuGroup[] = [
  {
    href: "/dashboard/base",
    label: "BASE Dashboard",
    children: [
      { href: "/dashboard/base#read-panel", label: "Staking Summary" },
      { href: "/dashboard/base#soft-staking", label: "Soft Staking" },
      { href: "/dashboard/base#reward-claim", label: "Reward Claim" },
    ],
  },
  {
    href: "/dashboard/ethereum",
    label: "Ethereum Dashboard",
    children: [
      { href: "/dashboard/ethereum#read-panel", label: "Staking Summary" },
      { href: "/dashboard/ethereum#soft-staking", label: "Soft Staking" },
      { href: "/dashboard/ethereum#reward-claim", label: "Reward Claim" },
    ],
  },
];

const adminChildren: MenuGroup[] = [
  {
    href: "/admin/base",
    label: "BASE Admin",
    children: [
      { href: "/admin/base#contract-list", label: "Contract List" },
      { href: "/admin/base#read-contract", label: "Contract Read" },
      { href: "/admin/base#registry-controls", label: "Registry Controls" },
      { href: "/admin/base#phase-controls", label: "Mint Phase" },
      { href: "/admin/base#money-controls", label: "Price & Royalty" },
      { href: "/admin/base#metadata-controls", label: "Metadata Controls" },
      { href: "/admin/base#round-controls", label: "Reward Round" },
      { href: "/admin/base#rescue-controls", label: "Emergency Rescue" },
    ],
  },
  {
    href: "/admin/ethereum",
    label: "Ethereum Admin",
    children: [
      { href: "/admin/ethereum#contract-list", label: "Contract List" },
      { href: "/admin/ethereum#read-contract", label: "Contract Read" },
      { href: "/admin/ethereum#registry-controls", label: "Registry Controls" },
      { href: "/admin/ethereum#phase-controls", label: "Mint Phase" },
      { href: "/admin/ethereum#money-controls", label: "Price & Royalty" },
      { href: "/admin/ethereum#metadata-controls", label: "Metadata Controls" },
      { href: "/admin/ethereum#round-controls", label: "Reward Round" },
      { href: "/admin/ethereum#rescue-controls", label: "Emergency Rescue" },
    ],
  },
];

const menuItems: MenuItem[] = [
  { href: "/", label: "Home" },
  {
    label: "Mint",
    children: [
      {
        href: "https://rotybase.endhonesa.com/",
        label: "ROTY BASE Mint",
        target: "_blank",
      },
      {
        href: "https://rotydeth.endhonesa.com/",
        label: "ROTY dETH Mint",
        target: "_blank",
      },
      {
        href: "https://meltingbase.endhonesa.com/",
        label: "Melting BASE Mint",
        target: "_blank",
      },
      {
        href: "https://meltingdeth.endhonesa.com/",
        label: "Melting dETH Mint",
        target: "_blank",
      },
      {
        href: "https://amandabase.endhonesa.com/",
        label: "Amanda BASE Mint",
        target: "_blank",
      },
      {
        href: "https://amandadeth.endhonesa.com/",
        label: "Amanda dETH Mint",
        target: "_blank",
      },
    ],
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    children: dashboardChildren,
  },
  {
    href: "/admin",
    label: "Admin",
    children: adminChildren,
  },
];

function hasChildren(item: MenuItem): item is MenuGroup {
  return "children" in item;
}

function isActivePath(pathname: string, href: string | undefined) {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, item: MenuItem): boolean {
  if (isActivePath(pathname, item.href)) {
    return true;
  }

  if (!hasChildren(item)) {
    return false;
  }

  return item.children.some((child) => groupIsActive(pathname, child));
}

function MenuLinkItem({
  item,
  onNavigate,
  size = "regular",
}: {
  item: MenuLink;
  onNavigate?: () => void;
  size?: "regular" | "small";
}) {
  return (
    <Link
      className={`block rounded-xl bg-black text-white transition hover:bg-(--oioi-accent) ${
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
  const navRef = useRef<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null);

  function closeMobileMenu() {
    setMobileOpen(false);
    setOpenMobileGroup(null);
  }

  function closeDesktopMenu() {
    setOpenDesktopGroup(null);
  }

  useEffect(() => {
    closeMobileMenu();
    closeDesktopMenu();
  }, [pathname]);

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
      <div className="rounded-2xl border border-white/10 bg-black p-1 md:gap-1 md:hidden">
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
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(82vw,360px)] rounded-2xl border border-white/10 bg-black p-2 shadow-2xl md:hidden">
          <div className="grid gap-1">
            {menuItems.map((item) => {
              const isActive = groupIsActive(pathname, item);

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
                    <div className="grid gap-1 rounded-xl p-2">
                      {item.href ? (
                        <MenuLinkItem
                          item={{
                            href: item.href,
                            label: `${item.label} Home`,
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
                                item={{ href: child.href, label: child.label }}
                                onNavigate={closeMobileMenu}
                                size="small"
                              />
                            ) : (
                              <div className="px-3 py-2 text-xs font-semibold text-white">
                                {child.label}
                              </div>
                            )}

                            <div className="mt-1 grid gap-1 pl-3">
                              {child.children.map((nested) =>
                                hasChildren(nested) ? null : (
                                  <MenuLinkItem
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
          const isActive = groupIsActive(pathname, item);

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

              <div
                className={`absolute left-0 top-full z-50 min-w-64 pt-2 transition ${
                  openDesktopGroup === item.label
                    ? "visible opacity-100"
                    : "invisible opacity-0"
                }`}>
                <div className="grid gap-1 rounded-2xl border border-white/10 bg-black p-2 shadow-2xl">
                  {item.href ? (
                    <MenuLinkItem
                      item={{ href: item.href, label: `${item.label} Home` }}
                      onNavigate={closeDesktopMenu}
                      size="small"
                    />
                  ) : null}

                  {item.children.map((child) =>
                    hasChildren(child) ? (
                      <div key={child.label}>
                        {child.href ? (
                          <MenuLinkItem
                            item={{ href: child.href, label: child.label }}
                            onNavigate={closeDesktopMenu}
                            size="small"
                          />
                        ) : (
                          <div className="px-3 py-2 text-xs font-semibold text-white">
                            {child.label}
                          </div>
                        )}

                        <div className="mt-1 grid gap-1 pl-3">
                          {child.children.map((nested) =>
                            hasChildren(nested) ? null : (
                              <MenuLinkItem
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
                        item={child}
                        key={child.href}
                        onNavigate={closeDesktopMenu}
                        size="small"
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
