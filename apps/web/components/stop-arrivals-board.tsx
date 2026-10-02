"use client";

import type { StopArrival } from "@steel-city/shared";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "@/lib/api";

function formatCountdown(arrival: StopArrival): string {
  if (arrival.minutesUntil === null) return "—";
  if (arrival.minutesUntil <= 0) return "Due";
  if (arrival.minutesUntil === 1) return "1 min";
  return `${arrival.minutesUntil} min`;
}

function formatDelay(delaySeconds: number | null): string | null {
  if (delaySeconds === null || delaySeconds <= 45) return null;
  const mins = Math.round(delaySeconds / 60);
  if (mins <= 0) return null;
  return `${mins} min late`;
}

type Props = {
  stopId: string;
};

export function StopArrivalsBoard({ stopId }: Props) {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["stop-arrivals", stopId],
    queryFn: () => getApi().getStopArrivals(stopId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const arrivals = data?.arrivals ?? [];

  return (
    <section aria-labelledby="live-arrivals-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="live-arrivals-heading" className="text-lg font-medium text-zinc-100">
            Live arrivals
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Predicted times from PRT trip updates (next few hours).
          </p>
        </div>
        {dataUpdatedAt > 0 && (
          <span className="text-xs text-zinc-600">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading arrivals…</p>}
      {error && (
        <p className="text-sm text-amber-200/90">
          Could not load live arrivals. Check that the API and worker are running.
        </p>
      )}

      {!isLoading && !error && arrivals.length === 0 && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-6 text-sm text-zinc-500">
          No upcoming predictions for this stop in the feed right now. Try again during service hours
          or check the{" "}
          <Link href="/map" className="text-[#FFB612] hover:underline">
            live map
          </Link>
          .
        </p>
      )}

      {arrivals.length > 0 && (
        <div className="pgh-steel-panel overflow-hidden rounded-xl">
          <div className="grid grid-cols-[4rem_1fr_5rem] gap-2 border-b border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[4rem_1fr_6rem_5rem]">
            <span>Route</span>
            <span>Destination</span>
            <span className="hidden sm:block">Status</span>
            <span className="text-right">Arrives</span>
          </div>
          <ul className="divide-y divide-zinc-800/80">
            {arrivals.map((a) => {
              const delay = formatDelay(a.delaySeconds);
              const routeLabel = a.routeShortName ?? a.routeId ?? "?";
              return (
                <li
                  key={`${a.tripId}-${a.arrivalTime ?? a.departureTime ?? ""}`}
                  className="grid grid-cols-[4rem_1fr_5rem] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[4rem_1fr_6rem_5rem]"
                >
                  {a.routeId ? (
                    <Link
                      href={`/routes/${encodeURIComponent(a.routeId)}`}
                      className="flex h-9 w-12 items-center justify-center rounded-lg bg-[#FFB612] text-sm font-bold text-black hover:brightness-105"
                    >
                      {routeLabel}
                    </Link>
                  ) : (
                    <span className="font-mono text-zinc-500">{routeLabel}</span>
                  )}
                  <span className="truncate text-zinc-300">{a.routeLongName ?? "Bus"}</span>
                  <span className="hidden text-xs text-zinc-500 sm:block">
                    {delay ? (
                      <span className="text-amber-300/90">{delay}</span>
                    ) : (
                      <span className="text-emerald-400/90">On time</span>
                    )}
                  </span>
                  <span className="text-right font-mono text-base font-semibold text-[#FFB612]">
                    {formatCountdown(a)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
