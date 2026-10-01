import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Live map" },
  { href: "/routes", label: "Routes" },
  { href: "/stops", label: "Stops" },
  { href: "/alerts", label: "Alerts" },
];

export function SiteNav() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-amber-400">
          Steel City Bus Line
        </Link>
        <ul className="flex flex-wrap gap-3 text-sm text-zinc-300">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
