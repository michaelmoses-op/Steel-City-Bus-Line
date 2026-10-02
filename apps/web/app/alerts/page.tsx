"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "@/lib/api";

export default function AlertsPage() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getApi().getAlerts(),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="pgh-checkered mb-3 h-1.5 w-24 rounded-sm" aria-hidden />
        <h1 className="text-2xl font-bold text-zinc-50">Service alerts</h1>
        <p className="mt-1 text-sm text-zinc-400">From PRT GTFS-Realtime. Route pages show alerts that apply to that line.</p>
        {dataUpdatedAt > 0 && (
          <p className="mt-1 text-xs text-zinc-600">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </header>

      {isLoading && <p className="text-zinc-500">Loading…</p>}
      {error && <p className="text-red-400">{String(error)}</p>}

      <ul className="space-y-4">
        {(data?.alerts ?? []).map((a) => (
          <li key={a.id} className="pgh-steel-panel rounded-xl p-5">
            <h2 className="font-semibold text-amber-300">{a.headerText ?? "Alert"}</h2>
            {a.descriptionText && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{a.descriptionText}</p>
            )}
            {a.routeIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {a.routeIds.map((id) => (
                  <Link
                    key={id}
                    href={`/routes/${encodeURIComponent(id)}`}
                    className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                  >
                    Route {id}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {data && data.alerts.length === 0 && (
        <p className="text-zinc-500">No active alerts in the feed right now.</p>
      )}
    </div>
  );
}
