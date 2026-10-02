import type { HealthResponse } from "@steel-city/shared";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { getApi } from "@/lib/api";

export default async function Home() {
  let health: HealthResponse | null = null;
  let routeCount: number | null = null;
  let vehicleCount: number | null = null;
  let alertCount: number | null = null;
  let error: string | null = null;

  try {
    health = await getApi().getHealth();
    if (health.database) {
      const routes = await getApi().getRoutes();
      routeCount = routes.length;
    }
    if (health.redis) {
      const { vehicles } = await getApi().getVehicles();
      vehicleCount = vehicles.length;
      const { alerts } = await getApi().getAlerts();
      alertCount = alerts.length;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "API unreachable";
  }

  return (
    <div className="space-y-10">
      <header className="pgh-steel-panel relative overflow-hidden rounded-2xl p-8">
        <div className="pgh-checkered absolute inset-x-0 top-0 h-2" aria-hidden />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <LogoMark className="h-16 w-16 shrink-0" />
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#FFB612]">PITTSBURGH & ALLEGHENY COUNTY</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">
              Know where your bus is
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Live buses, routes, stops, and alerts — built on PRT open data
            </p>
          </div>
        </div>
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

      <div className="flex flex-wrap gap-3">
        <PrimaryLink href="/map">Open live map</PrimaryLink>
        <SecondaryLink href="/routes">Browse routes</SecondaryLink>
        <SecondaryLink href="/stops">Find stops</SecondaryLink>
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
    <Link href={href} className="pgh-steel-panel group overflow-hidden rounded-xl transition hover:border-[#FFB612]/50">
      <div className="pgh-checkered-subtle h-1.5 opacity-80 group-hover:opacity-100" aria-hidden />
      <div className="p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-[#FFB612]">{value === null ? "—" : value}</p>
      </div>
    </Link>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="pgh-btn-primary rounded-lg px-5 py-2.5 text-sm">
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm text-zinc-200 hover:border-[#FFB612] hover:text-[#FFB612]"
    >
      {children}
    </Link>
  );
}
