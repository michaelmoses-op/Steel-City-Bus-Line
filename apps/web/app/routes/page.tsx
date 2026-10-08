"use client";

import type { RouteSummary } from "@steel-city/shared";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { PlanOptionGroup } from "@/components/plan-option-group";
import { RouteListRow } from "@/components/route-list-row";
import { getApi } from "@/lib/api";

const RoutesOverviewMap = dynamic(
  () => import("@/components/routes-overview-map").then((m) => m.RoutesOverviewMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(55vh,480px)] w-full animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
        aria-hidden
      />
    ),
  },
);

function routeSortKey(r: RouteSummary): string {
  return (r.routeShortName ?? r.routeId).toLowerCase();
}

function compareRoutes(a: RouteSummary, b: RouteSummary): number {
  return routeSortKey(a).localeCompare(routeSortKey(b), undefined, { numeric: true });
}

function matchesSearch(r: RouteSummary, term: string): boolean {
  return (
    r.routeId.toLowerCase().includes(term) ||
    (r.routeShortName?.toLowerCase().includes(term) ?? false) ||
    (r.routeLongName?.toLowerCase().includes(term) ?? false)
  );
}

export default function RoutesPage() {
  const [q, setQ] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"all" | "live">("all");

  const { data: routes, isLoading, error } = useQuery({
    queryKey: ["routes"],
    queryFn: () => getApi().getRoutes(),
  });

  const { data: routeShapes, isLoading: shapesLoading } = useQuery({
    queryKey: ["route-map-shapes"],
    queryFn: () => getApi().getRouteMapShapes(),
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: vehiclePayload,
    isLoading: vehiclesLoading,
    dataUpdatedAt: vehiclesUpdatedAt,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => getApi().getVehicles(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const liveBusCountByRoute = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of vehiclePayload?.vehicles ?? []) {
      if (!v.routeId) continue;
      counts.set(v.routeId, (counts.get(v.routeId) ?? 0) + 1);
    }
    return counts;
  }, [vehiclePayload?.vehicles]);

  const { liveRoutes, otherRoutes } = useMemo(() => {
    if (!routes) return { liveRoutes: [] as RouteSummary[], otherRoutes: [] as RouteSummary[] };
    const term = q.trim().toLowerCase();
    const filtered = term ? routes.filter((r) => matchesSearch(r, term)) : routes;

    const live: RouteSummary[] = [];
    const other: RouteSummary[] = [];
    for (const r of filtered) {
      if ((liveBusCountByRoute.get(r.routeId) ?? 0) > 0) {
        live.push(r);
      } else {
        other.push(r);
      }
    }

    live.sort((a, b) => {
      const diff =
        (liveBusCountByRoute.get(b.routeId) ?? 0) - (liveBusCountByRoute.get(a.routeId) ?? 0);
      return diff !== 0 ? diff : compareRoutes(a, b);
    });
    other.sort(compareRoutes);

    return { liveRoutes: live, otherRoutes: other };
  }, [routes, q, liveBusCountByRoute]);

  const liveRouteIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [routeId, count] of liveBusCountByRoute) {
      if (count > 0) ids.add(routeId);
    }
    return ids;
  }, [liveBusCountByRoute]);

  const showSplitSections = !q.trim();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Routes"
        actions={
          <PlanOptionGroup
            legend="Map routes"
            hideLegend
            name="routes-map-mode"
            value={mapMode}
            onChange={setMapMode}
            options={[
              { id: "all", label: "All routes" },
              { id: "live", label: "Live only" },
            ]}
          />
        }
      />

      <section aria-label="Routes map" className="pgh-steel-panel overflow-hidden rounded-2xl p-3 sm:p-4">
        {shapesLoading && <p className="text-sm text-zinc-500">Loading route lines…</p>}
        {routeShapes && routeShapes.length > 0 && (
          <RoutesOverviewMap
            shapes={routeShapes}
            liveRouteIds={liveRouteIds}
            selectedRouteId={selectedRouteId}
            onSelectedRouteIdChange={setSelectedRouteId}
            mapMode={mapMode}
          />
        )}
      </section>

      <input
        type="search"
        placeholder="Search by number or name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="pgh-input w-full px-5 py-3.5 text-sm"
      />

      {isLoading && <p className="text-zinc-500">Loading routes…</p>}
      {error && <p className="text-red-400">{String(error)}</p>}

      {!isLoading && !error && vehiclesLoading && (
        <p className="text-sm text-zinc-500">Checking which routes are live…</p>
      )}

      {vehiclesUpdatedAt > 0 && (
        <p className="text-xs text-zinc-500">
          Live status from{" "}
          {new Date(vehiclesUpdatedAt).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      {showSplitSections && liveRoutes.length > 0 && (
        <section aria-labelledby="live-routes-heading">
          <h2 id="live-routes-heading" className="pgh-section-label mb-3">
            Live now · {liveRoutes.length} routes
          </h2>
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-pgh-panel">
            {liveRoutes.map((r) => (
              <RouteListRow
                key={r.routeId}
                route={r}
                liveBusCount={liveBusCountByRoute.get(r.routeId)}
              />
            ))}
          </ul>
        </section>
      )}

      {showSplitSections && otherRoutes.length > 0 && (
        <section aria-labelledby="all-routes-heading">
          <h2
            id="all-routes-heading"
            className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400"
          >
            {liveRoutes.length > 0 ? "All other routes" : "All routes"}
          </h2>
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-pgh-panel">
            {otherRoutes.map((r) => (
              <RouteListRow key={r.routeId} route={r} />
            ))}
          </ul>
        </section>
      )}

      {showSplitSections && liveRoutes.length === 0 && otherRoutes.length === 0 && !isLoading && (
        <p className="text-sm text-zinc-500">No routes found.</p>
      )}

      {!showSplitSections && (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">
            Search results
          </h2>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {[...liveRoutes, ...otherRoutes].length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">No routes match your search.</li>
            ) : (
              [...liveRoutes, ...otherRoutes].map((r) => (
                <RouteListRow
                  key={r.routeId}
                  route={r}
                  liveBusCount={liveBusCountByRoute.get(r.routeId)}
                />
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
