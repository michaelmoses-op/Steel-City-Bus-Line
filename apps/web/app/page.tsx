import type { HealthResponse, RouteSummary } from "@steel-city/shared";
import Link from "next/link";
import { RouteListRow } from "@/components/route-list-row";
import { getApi } from "@/lib/api";

export default async function Home() {
  let health: HealthResponse | null = null;
  let routeCount: number | null = null;
  let vehicleCount: number | null = null;
  let alertCount: number | null = null;
  let liveRoutes: { route: RouteSummary; buses: number }[] = [];
  let error: string | null = null;

  try {
    health = await getApi().getHealth();
    if (health.database) {
      const routes = await getApi().getRoutes();
      routeCount = routes.length;
      if (health.redis) {
        const { vehicles } = await getApi().getVehicles();
        vehicleCount = vehicles.length;
        const counts = new Map<string, number>();
        for (const v of vehicles) {
          if (!v.routeId) continue;
          counts.set(v.routeId, (counts.get(v.routeId) ?? 0) + 1);
        }
        liveRoutes = routes
          .filter((r) => (counts.get(r.routeId) ?? 0) > 0)
          .map((r) => ({ route: r, buses: counts.get(r.routeId) ?? 0 }))
          .sort((a, b) => b.buses - a.buses)
          .slice(0, 6);
      }
    }
    if (health.redis) {
      const { alerts } = await getApi().getAlerts();
      alertCount = alerts.length;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "API unreachable";
  }

  return (
    <div className="space-y-12">
      <section>
        <p className="pgh-kicker">Pittsburgh &amp; Allegheny County</p>
        <h1 className="pgh-page-title mt-3 max-w-xl">
          Know where
          <br />
          your bus is
        </h1>
        <p className="mt-4 max-w-lg text-sm text-zinc-400">
          Live buses, routes, stops, and alerts — built on PRT open data.
        </p>
      </section>

      {error && (
        <p className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          {error}. Start the stack with <code className="text-red-200">make dev</code> and ensure
          Docker (Postgres + Redis) is running.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Routes" value={routeCount} href="/routes" />
        <StatCard label="Live" value={vehicleCount} href="/map" highlight />
        <StatCard label="Alerts" value={alertCount} href="/alerts" />
      </div>

      {liveRoutes.length > 0 && (
        <section aria-labelledby="home-live-heading">
          <h2 id="home-live-heading" className="pgh-section-label mb-3">
            Live now · {liveRoutes.length} routes
          </h2>
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-pgh-panel">
            {liveRoutes.map(({ route, buses }) => (
              <RouteListRow key={route.routeId} route={route} liveBusCount={buses} />
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/routes" className="font-semibold text-pgh-gold hover:underline">
              View all routes →
            </Link>
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/map" className="pgh-btn-primary rounded-full px-6 py-2.5 text-sm">
          Open live map
        </Link>
        <Link
          href="/stops"
          className="rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-semibold text-zinc-200 hover:border-pgh-gold hover:text-pgh-gold"
        >
          Nearby stops
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string;
  value: number | null;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`pgh-stat-card block ${highlight ? "pgh-stat-card--live" : ""}`}
    >
      <p className="pgh-stat-label">{label}</p>
      <p className="pgh-stat-value">{value === null ? "—" : value}</p>
    </Link>
  );
}
