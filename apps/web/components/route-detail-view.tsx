"use client";

import type { RouteDetail } from "@steel-city/shared";
import Link from "next/link";
import { formatGtfsTime } from "@/lib/format-gtfs-time";
import { LiveMap } from "./live-map";
import { RouteAlertsPanel } from "./route-alerts-panel";
import { RouteShapeMap } from "./route-shape-map";

export function RouteDetailView({ route }: { route: RouteDetail }) {
  const badgeColor = route.routeColor ? `#${route.routeColor}` : "#FFB612";

  return (
    <div className="space-y-8">
      <RouteAlertsPanel routeId={route.routeId} />

      <header className="pgh-steel-panel overflow-hidden rounded-2xl">
        <div className="pgh-checkered h-1.5" aria-hidden />
        <div className="p-6">
          <p className="text-sm text-zinc-500">
            <Link href="/routes" className="hover:text-[#FFB612]">
              Routes
            </Link>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className="rounded-lg px-3 py-1 text-lg font-bold text-black"
              style={{ backgroundColor: badgeColor }}
            >
              {route.routeShortName ?? route.routeId}
            </span>
            <h1 className="text-2xl font-semibold text-zinc-50">{route.routeLongName}</h1>
          </div>
          {route.tripHeadsign && (
            <p className="mt-2 text-sm text-zinc-400">Via {route.tripHeadsign}</p>
          )}
          <Link
            href={`/map?route=${encodeURIComponent(route.routeId)}`}
            className="mt-3 inline-block text-sm font-medium text-[#FFB612] hover:underline"
          >
            Track live on map →
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-medium text-zinc-100">Route shape</h2>
        <RouteShapeMap shape={route.shape} stops={route.stops} routeColor={route.routeColor} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-zinc-100">Live vehicles</h2>
        <LiveMap routeId={route.routeId} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Stop timetable</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">{route.scheduleNote}</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-zinc-600">
            {route.stops.length} stops
          </span>
        </div>
        <div className="pgh-steel-panel overflow-hidden rounded-xl">
          <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem] gap-2 border-b border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>#</span>
            <span>Stop</span>
            <span className="text-right">Arrive</span>
            <span className="text-right">Depart</span>
          </div>
          <ol className="pgh-scroll max-h-[28rem] overflow-y-auto">
            {route.stops.map((s) => (
              <li
                key={`${s.stopId}-${s.stopSequence}`}
                className="grid grid-cols-[2.5rem_1fr_5rem_5rem] gap-2 border-b border-zinc-800/80 px-4 py-2.5 text-sm transition hover:bg-zinc-900/60"
              >
                <span className="font-mono text-zinc-500">{s.stopSequence}</span>
                <Link
                  href={`/stops/${encodeURIComponent(s.stopId)}`}
                  className="truncate text-zinc-200 hover:text-[#FFB612]"
                >
                  {s.stopName}
                </Link>
                <span className="text-right font-mono text-xs text-zinc-400">
                  {formatGtfsTime(s.arrivalTime)}
                </span>
                <span className="text-right font-mono text-xs text-[#FFB612]">
                  {formatGtfsTime(s.departureTime)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
