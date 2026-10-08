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
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 transition hover:bg-zinc-900/60 sm:px-5"
      >
        <span
          className="min-w-[3rem] shrink-0 rounded-md px-2 py-1 text-center text-sm font-bold text-black"
          style={badgeStyle}
        >
          {route.routeShortName ?? route.routeId}
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-wide text-zinc-200 sm:text-base">
          {route.routeLongName ?? "Unnamed route"}
        </span>
        {isLive && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-400 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            Live
            <span className="font-semibold text-emerald-400/90">
              · {liveBusCount} {liveBusCount === 1 ? "bus" : "buses"}
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}
