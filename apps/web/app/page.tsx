import { createApiClient } from "@steel-city/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function Home() {
  let health: { ok: true; version: string; service?: string } | null = null;
  let error: string | null = null;

  try {
    const client = createApiClient({ baseUrl: apiBaseUrl });
    health = await client.getHealth();
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
            Monorepo scaffold — web, API, and worker. Live maps and routes come in
            later phases.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium">API health</h2>
          <p className="mt-1 text-sm text-zinc-500">
            GET {apiBaseUrl}/api/v1/health
          </p>

          {health ? (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-emerald-400">
              {JSON.stringify(health, null, 2)}
            </pre>
          ) : (
            <p className="mt-4 text-sm text-red-400">
              {error ?? "Unknown error"}
            </p>
          )}

          {!health && (
            <p className="mt-3 text-sm text-zinc-500">
              Start the stack from the repo root:{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5">pnpm dev</code>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
