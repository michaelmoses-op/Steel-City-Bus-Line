"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

const DEFAULT = { lat: 40.4406, lon: -79.9959 };

export default function StopsPage() {
  const [lat, setLat] = useState(DEFAULT.lat);
  const [lon, setLon] = useState(DEFAULT.lon);
  const [radius, setRadius] = useState(600);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["nearby-stops", lat, lon, radius],
    queryFn: () => api.getNearbyStops(lat, lon, radius),
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
    <div>
      <h1 className="text-2xl font-semibold">Nearby stops</h1>
      <p className="mt-1 text-sm text-zinc-500">Search from your location or downtown Pittsburgh.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-900"
        >
          Use my location
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Radius (m)
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          />
        </label>
      </div>

      {isLoading && <p className="mt-4 text-zinc-500">Loading…</p>}
      {error && <p className="mt-4 text-red-400">{String(error)}</p>}

      <ul className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {data?.map((s) => (
          <li key={s.stopId}>
            <Link
              href={`/stops/${encodeURIComponent(s.stopId)}`}
              className="flex justify-between px-4 py-3 hover:bg-zinc-900/80"
            >
              <span>{s.stopName}</span>
              <span className="text-sm text-zinc-500">{s.distanceM} m</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
