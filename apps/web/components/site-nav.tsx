"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isTripPlannerEnabled } from "@/lib/features";
import { BrandLockup } from "./brand-lockup";

const allLinks = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan trip", tripPlannerOnly: true },
  { href: "/map", label: "Live map" },
  { href: "/routes", label: "Routes" },
  { href: "/stops", label: "Stops" },
  { href: "/alerts", label: "Alerts" },
] as const;

const links = allLinks.filter((l) => !("tripPlannerOnly" in l && l.tripPlannerOnly) || isTripPlannerEnabled());

function navLinkClass(active: boolean): string {
  return `block rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-pgh-gold text-black shadow-[0_2px_0_#000]"
      : "text-zinc-200 hover:bg-zinc-900 hover:text-white"
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
    <header className="sticky top-0 z-50 bg-black">
      <div className="pgh-checkered h-2 w-full" aria-hidden />
      <nav className="border-b border-zinc-900 bg-black/95 backdrop-blur-md" aria-label="Main">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <Link
              href="/"
              className="inline-flex min-w-0 shrink items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pgh-gold"
            >
              <BrandLockup markClassName="h-10 w-10 sm:h-11 sm:w-11" />
            </Link>

            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 lg:hidden"
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
              <ul className="flex flex-col gap-1 text-sm max-lg:border-t max-lg:border-zinc-800 max-lg:pt-3 lg:flex-row lg:items-center lg:gap-0.5 lg:border-0 lg:pt-0">
                {links.map((l) => {
                  const active =
                    l.href === "/"
                      ? pathname === "/"
                      : pathname === l.href || pathname.startsWith(`${l.href}/`);
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
