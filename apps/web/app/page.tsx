import Link from "next/link";
import { api } from "@/lib/api";

export default async function Home() {
  let health: Awaited<ReturnType<typeof api.getHealth>> | null = null;
  let routeCount: number | null = null;
  let vehicleCount: number | null = null;
  let alertCount: number | null = null;
  let error: string | null = null;

  try {
    health = await api.getHealth();
    if (health.database) {
      const routes = await api.getRoutes();
      routeCount = routes.length;
    }
    if (health.redis) {
      const { vehicles } = await api.getVehicles();
      vehicleCount = vehicles.length;
      const { alerts } = await api.getAlerts();
      alertCount = alerts.length;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "API unreachable";
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Pittsburgh transit, clearer</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Live buses, routes, stops, and service alerts for the Port Authority service area.
          Data from PRT GTFS and GTFS-Realtime, with stale vehicles filtered on the server.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          {error}. Start the stack with <code className="text-red-200">pnpm dev</code> and ensure
          Docker (Postgres + Redis) is running.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Routes" value={routeCount} href="/routes" />
        <StatCard label="Live buses" value={vehicleCount} href="/map" />
        <StatCard label="Active alerts" value={alertCount} href="/alerts" />
      </div>

      {health && (
        <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500">
          {JSON.stringify(health, null, 2)}
        </pre>
      )}

      <div className="flex flex-wrap gap-3">
        <PrimaryLink href="/map">Open live map</PrimaryLink>
        <PrimaryLink href="/routes">Browse routes</PrimaryLink>
        <PrimaryLink href="/stops">Find stops</PrimaryLink>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-amber-500/40"
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-amber-400">
        {value === null ? "—" : value}
      </p>
    </Link>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
    >
      {children}
    </Link>
  );
}
