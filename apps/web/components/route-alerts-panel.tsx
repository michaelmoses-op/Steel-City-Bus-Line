"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "@/lib/api";

type Props = {
  routeId?: string;
  className?: string;
};

export function RouteAlertsPanel({ routeId, className }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["alerts", routeId ?? "all"],
    queryFn: () => getApi().getAlerts(routeId ? { routeId } : undefined),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const alerts = data?.alerts ?? [];
  if (isLoading || alerts.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-amber-500/35 bg-amber-950/25 p-4 ${className ?? ""}`}
      role="region"
      aria-label={routeId ? "Alerts for this route" : "Service alerts"}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
        {routeId ? "Alerts for this route" : "Active service alerts"}
      </p>
      <ul className="mt-3 space-y-3">
        {alerts.slice(0, 5).map((a) => (
          <li key={a.id} className="text-sm">
            <p className="font-medium text-amber-200">{a.headerText ?? "Service alert"}</p>
            {a.descriptionText && (
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-zinc-400">
                {a.descriptionText}
              </p>
            )}
          </li>
        ))}
      </ul>
      {alerts.length > 5 && (
        <p className="mt-2 text-xs text-zinc-500">+ {alerts.length - 5} more on the alerts page.</p>
      )}
      <Link href="/alerts" className="mt-3 inline-block text-xs font-medium text-[#FFB612] hover:underline">
        View all alerts →
      </Link>
    </div>
  );
}
