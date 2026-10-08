"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { getApi } from "@/lib/api";

const DEFAULT = { lat: 40.4406, lon: -79.9959 };

export default function StopsPage() {
  const [lat, setLat] = useState(DEFAULT.lat);
  const [lon, setLon] = useState(DEFAULT.lon);
  const [radius, setRadius] = useState(600);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["nearby-stops", lat, lon, radius],
    queryFn: () => getApi().getNearbyStops(lat, lon, radius),
  });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getApi().getAlerts(),
    staleTime: 60_000,
  });

  const topAlert = alertsData?.alerts[0];

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);
      void refetch();
    });
  }

  return (
    <div className="space-y-8">
      <PageHeading
        title="Nearby stops"
        subtitle="Downtown Pittsburgh by default — or use your location."
        meta={`Within ${radius} m`}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_min(100%,16rem)] lg:items-start">
        <div className="space-y-4">
          <div className="pgh-steel-panel overflow-hidden rounded-2xl">
            <ul className="pgh-scroll max-h-[32rem] divide-y divide-zinc-800/90 overflow-y-auto">
              {(isLoading || isFetching) && !data && (
                <li className="px-5 py-8 text-center text-sm text-zinc-500">Searching…</li>
              )}
              {data?.map((s) => (
                <li key={s.stopId}>
                  <Link
                    href={`/stops/${encodeURIComponent(s.stopId)}`}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-zinc-900/70"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide text-zinc-100 group-hover:text-pgh-gold sm:text-base">
                      {s.stopName}
                    </span>
                    <span className="shrink-0 rounded-full border border-zinc-700 bg-black px-3 py-1 font-mono text-xs font-semibold text-pgh-gold">
                      {s.distanceM} m
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {data && data.length === 0 && (
              <p className="p-8 text-center text-sm text-zinc-500">No stops in this radius.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{String(error)}</p>}

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            Radius (m)
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-24 rounded-full border border-zinc-600 bg-black px-3 py-1.5 text-zinc-100"
            />
          </label>
        </div>

        <aside className="space-y-4">
          {topAlert && (
            <div className="pgh-alert-card pl-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-pgh-gold">
                Service alert
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-lg uppercase leading-tight text-zinc-50">
                {topAlert.headerText ?? "Alert"}
              </p>
              {topAlert.routeIds.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  Routes {topAlert.routeIds.slice(0, 6).join(", ")}
                  {topAlert.routeIds.length > 6 ? "…" : ""}
                </p>
              )}
              <Link href="/alerts" className="mt-3 inline-block text-xs font-bold uppercase text-pgh-gold hover:underline">
                All alerts →
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={useMyLocation}
            className="pgh-btn-primary w-full rounded-full px-6 py-3.5 text-sm"
          >
            Use my location
          </button>
        </aside>
      </div>
    </div>
  );
}
