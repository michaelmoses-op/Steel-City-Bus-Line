"use client";

import type { RouteDetail } from "@steel-city/shared";
import Link from "next/link";
import { LiveMap } from "./live-map";
import { RouteShapeMap } from "./route-shape-map";

export function RouteDetailView({ route }: { route: RouteDetail }) {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-zinc-500">
          <Link href="/routes" className="hover:text-zinc-300">
            Routes
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {route.routeShortName ?? route.routeId}{" "}
          <span className="font-normal text-zinc-400">{route.routeLongName}</span>
        </h1>
        <Link
          href={`/map?route=${encodeURIComponent(route.routeId)}`}
          className="mt-2 inline-block text-sm text-amber-400 hover:underline"
        >
          Track live on map →
        </Link>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-medium">Route shape</h2>
        <RouteShapeMap shape={route.shape} stops={route.stops} routeColor={route.routeColor} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Live vehicles</h2>
        <LiveMap routeId={route.routeId} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Stops ({route.stops.length})</h2>
        <ol className="max-h-96 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 p-4 text-sm">
          {route.stops.map((s) => (
            <li key={`${s.stopId}-${s.stopSequence}`}>
              <Link
                href={`/stops/${encodeURIComponent(s.stopId)}`}
                className="hover:text-amber-400"
              >
                {s.stopSequence}. {s.stopName}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
