"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "./logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Live map" },
  { href: "/routes", label: "Routes" },
  { href: "/stops", label: "Stops" },
  { href: "/alerts", label: "Alerts" },
];

function navLinkClass(active: boolean): string {
  return `block rounded-md px-3 py-2 transition ${
    active
      ? "bg-[#FFB612] font-semibold text-black"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
  }`;
}

export function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="pgh-checkered h-1.5 w-full" aria-hidden />
      <nav className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md" aria-label="Main">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <LogoMark className="h-10 w-10 shrink-0" />
              <div className="leading-tight">
                <span className="block text-sm font-bold tracking-wide text-[#FFB612]">
                  STEEL CITY
                </span>
                <span className="block text-xs font-medium text-zinc-400">Bus Line</span>
              </div>
            </Link>

            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-nav-links"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>

            <div
              id="site-nav-links"
              className={`w-full basis-full lg:ml-auto lg:w-auto lg:basis-auto ${menuOpen ? "max-lg:block" : "max-lg:hidden"} lg:block`}
            >
              <ul className="flex flex-col gap-0.5 text-sm max-lg:border-t max-lg:border-zinc-800/80 max-lg:pt-2 lg:flex-row lg:gap-1 lg:border-0 lg:pt-0">
                {links.map((l) => {
                  const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={navLinkClass(active)}
                        onClick={() => setMenuOpen(false)}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <div className="pgh-checkered-subtle h-1 w-full" aria-hidden />
      </nav>
    </header>
  );
}
