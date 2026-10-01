import { createApiClient } from "@steel-city/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function Home() {
  const client = createApiClient({ baseUrl: apiBaseUrl });

  let health: Awaited<ReturnType<typeof client.getHealth>> | null = null;
  let routes: Awaited<ReturnType<typeof client.getRoutes>> | null = null;
  let error: string | null = null;

  try {
    health = await client.getHealth();
    if (health.database) {
      routes = await client.getRoutes();
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not reach API";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
        <header>
          <p className="text-sm font-medium uppercase tracking-wider text-amber-400">
            Steel City Bus Line
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Pittsburgh transit, done better
          </h1>
          <p className="mt-3 text-zinc-400">
            Phase 2 — static GTFS in Postgres. Run{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5">pnpm db:up</code>, migrate, and{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5">pnpm gtfs:import</code> to load
            routes.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium">API health</h2>
          {health ? (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-emerald-400">
              {JSON.stringify(health, null, 2)}
            </pre>
          ) : (
            <p className="mt-4 text-sm text-red-400">{error ?? "Unknown error"}</p>
          )}
        </section>

        {routes && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-medium">Routes loaded</h2>
            <p className="mt-2 text-3xl font-semibold text-amber-400">{routes.length}</p>
            <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-sm text-zinc-400">
              {routes.slice(0, 12).map((r) => (
                <li key={r.routeId}>
                  {r.routeShortName ?? r.routeId} — {r.routeLongName ?? "—"}
                </li>
              ))}
            </ul>
            {routes.length > 12 && (
              <p className="mt-2 text-xs text-zinc-600">Showing 12 of {routes.length}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
