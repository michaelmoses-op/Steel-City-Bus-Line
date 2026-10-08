"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/page-heading";
import { getApi } from "@/lib/api";

export default function AlertsPage() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getApi().getAlerts(),
    refetchInterval: 60_000,
  });

  const alerts = data?.alerts ?? [];
  const updated =
    dataUpdatedAt > 0
      ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
      : null;

  return (
    <div className="space-y-8">
      <PageHeading
        title="Service alerts"
        subtitle="From PRT GTFS-Realtime. Route pages show alerts that apply to that line."
        meta={
          updated && alerts.length > 0
            ? `${updated} · ${alerts.length} active`
            : updated ?? undefined
        }
      />

      {isLoading && <p className="text-zinc-500">Loading…</p>}
      {error && <p className="text-red-400">{String(error)}</p>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {alerts.map((a) => (
          <li key={a.id} className="pgh-alert-card pl-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-pgh-gold">
              {a.headerText ?? "Alert"}
            </h2>
            {a.descriptionText && (
              <p className="mt-2 line-clamp-4 text-sm text-zinc-400">{a.descriptionText}</p>
            )}
            {a.routeIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {a.routeIds.map((id) => (
                  <Link
                    key={id}
                    href={`/routes/${encodeURIComponent(id)}`}
                    className="rounded-full border border-zinc-600 bg-black/40 px-3 py-1 text-xs font-semibold text-zinc-200 hover:border-pgh-gold hover:text-pgh-gold"
                  >
                    Route {id}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {data && alerts.length === 0 && (
        <p className="text-zinc-500">No active alerts in the feed right now.</p>
      )}
    </div>
  );
}
