import Link from "next/link";
import { notFound } from "next/navigation";
import { getApi } from "@/lib/api";

type Props = { params: Promise<{ stopId: string }> };

export default async function StopDetailPage({ params }: Props) {
  const { stopId } = await params;

  let stop;
  try {
    stop = await getApi().getStop(stopId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="pgh-steel-panel overflow-hidden rounded-2xl">
        <div className="pgh-checkered h-1.5" aria-hidden />
        <div className="p-6">
          <p className="text-sm text-zinc-500">
            <Link href="/stops" className="hover:text-[#FFB612]">
              Stops
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-50">{stop.stopName}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
          </p>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium text-zinc-100">Routes at this stop</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {stop.routes.map((r) => (
            <li key={r.routeId}>
              <Link
                href={`/routes/${encodeURIComponent(r.routeId)}`}
                className="pgh-steel-panel flex items-center gap-3 rounded-xl p-4 transition hover:border-[#FFB612]/40"
              >
                <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-[#FFB612] text-sm font-bold text-black">
                  {r.routeShortName ?? r.routeId}
                </span>
                <span className="text-sm text-zinc-300">{r.routeLongName ?? "Route"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-zinc-500">
        Open a route for the full stop timetable. For buses in motion now, see the{" "}
        <Link href="/map" className="text-[#FFB612] hover:underline">
          live map
        </Link>
        .
      </p>
    </div>
  );
}
