"use client";

import type { StopDetail } from "@steel-city/shared";
import Link from "next/link";
import { getRouteBadgeStyle } from "@/lib/route-badge-style";
import { StopArrivalsBoard } from "./stop-arrivals-board";
import { StopLocationMap } from "./stop-location-map";

export function StopDetailView({ stop }: { stop: StopDetail }) {
  return (
    <div className="space-y-8">
      <header className="pgh-steel-panel overflow-hidden rounded-2xl">
        <div className="pgh-checkered h-1.5" aria-hidden />
        <div className="p-6">
          <p className="text-sm text-zinc-500">
            <Link href="/stops" className="hover:text-[#FFB612]">
              Stops
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-50">{stop.stopName}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
          </p>
        </div>
      </header>

      <section aria-label="Stop location">
        <h2 className="mb-2 text-lg font-medium text-zinc-100">Map</h2>
        <StopLocationMap lat={stop.lat} lon={stop.lon} stopName={stop.stopName} />
      </section>

      <StopArrivalsBoard stopId={stop.stopId} />

      <section>
        <h2 className="text-lg font-medium text-zinc-100">Routes at this stop</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {stop.routes.map((r) => (
            <li key={r.routeId}>
              <Link
                href={`/routes/${encodeURIComponent(r.routeId)}`}
                className="pgh-steel-panel flex items-center gap-3 rounded-xl p-4 transition hover:border-[#FFB612]/40"
              >
                <span
                  className="min-w-[3rem] shrink-0 rounded px-2 py-0.5 text-center text-sm font-bold"
                  style={getRouteBadgeStyle(r.routeColor, r.routeTextColor)}
                >
                  {r.routeShortName ?? r.routeId}
                </span>
                <span className="text-sm text-zinc-300">{r.routeLongName ?? "Route"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
