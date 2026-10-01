"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AlertsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Service alerts</h1>
      <p className="mt-1 text-sm text-zinc-500">From PRT GTFS-Realtime alerts feed.</p>

      {isLoading && <p className="mt-4 text-zinc-500">Loading…</p>}
      {error && <p className="mt-4 text-red-400">{String(error)}</p>}

      <ul className="mt-6 space-y-4">
        {(data?.alerts ?? []).map((a) => (
          <li key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="font-medium text-amber-400">{a.headerText ?? "Alert"}</h2>
            {a.descriptionText && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{a.descriptionText}</p>
            )}
            {a.routeIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {a.routeIds.map((id) => (
                  <Link
                    key={id}
                    href={`/routes/${encodeURIComponent(id)}`}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-xs hover:bg-zinc-700"
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
        <p className="mt-6 text-zinc-500">No active alerts in the feed right now.</p>
      )}
    </div>
  );
}
