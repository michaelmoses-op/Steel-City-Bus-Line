import type { RouteSummary } from "@steel-city/shared";
import Link from "next/link";
import { getRouteBadgeStyle } from "@/lib/route-badge-style";

type Props = {
  route: RouteSummary;
  liveBusCount?: number;
};

export function RouteListRow({ route, liveBusCount }: Props) {
  const isLive = liveBusCount !== undefined && liveBusCount > 0;
  const badgeStyle = getRouteBadgeStyle(route.routeColor, route.routeTextColor);

  return (
    <li>
      <Link
        href={`/routes/${encodeURIComponent(route.routeId)}`}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-zinc-900/80"
      >
        <span
          className="min-w-[3rem] shrink-0 rounded px-2 py-0.5 text-center text-sm font-bold"
          style={badgeStyle}
        >
          {route.routeShortName ?? route.routeId}
        </span>
        <span className="min-w-0 flex-1 text-zinc-300">
          {route.routeLongName ?? "Unnamed route"}
        </span>
        {isLive && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <span
              className="relative flex h-2 w-2"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live
            <span className="font-normal text-emerald-400/80">
              · {liveBusCount} {liveBusCount === 1 ? "bus" : "buses"}
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}
