"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);
      void refetch();
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="pgh-checkered mb-3 h-1.5 w-24 rounded-sm" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-50">Nearby stops</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Downtown Pittsburgh by default — or use your location.
        </p>
      </header>

      <div className="pgh-steel-panel flex flex-wrap items-center gap-3 rounded-xl p-4">
        <button type="button" onClick={useMyLocation} className="pgh-btn-primary rounded-lg px-4 py-2 text-sm">
          Use my location
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Radius (m)
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-24 rounded-lg border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-zinc-100"
          />
        </label>
        {(isLoading || isFetching) && (
          <span className="text-sm text-zinc-500">Searching…</span>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{String(error)}</p>}

      <div className="pgh-steel-panel overflow-hidden rounded-xl">
        <div className="pgh-checkered-subtle h-1" aria-hidden />
        <ul className="pgh-scroll max-h-[32rem] divide-y divide-zinc-800/90 overflow-y-auto">
          {data?.map((s) => (
            <li key={s.stopId}>
              <Link
                href={`/stops/${encodeURIComponent(s.stopId)}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-zinc-900/70"
              >
                <span className="font-medium text-zinc-100 group-hover:text-[#FFB612]">
                  {s.stopName}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
                  {s.distanceM} m
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {data && data.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-500">No stops in this radius.</p>
        )}
      </div>
    </div>
  );
}
