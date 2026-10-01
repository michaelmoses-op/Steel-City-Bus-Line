import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

type Props = { params: Promise<{ stopId: string }> };

export default async function StopDetailPage({ params }: Props) {
  const { stopId } = await params;

  let stop;
  try {
    stop = await api.getStop(stopId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-zinc-500">
          <Link href="/stops" className="hover:text-zinc-300">
            Stops
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{stop.stopName}</h1>
        <p className="text-sm text-zinc-500">
          {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
        </p>
      </header>

      <section>
        <h2 className="text-lg font-medium">Routes serving this stop</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {stop.routes.map((r) => (
            <li key={r.routeId}>
              <Link
                href={`/routes/${encodeURIComponent(r.routeId)}`}
                className="inline-block rounded-lg bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
              >
                {r.routeShortName ?? r.routeId}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-zinc-600">
        Live arrival predictions will use GTFS-RT trip updates in a future release. Use the{" "}
        <Link href="/map" className="text-amber-400 hover:underline">
          live map
        </Link>{" "}
        to see buses near this stop.
      </p>
    </div>
  );
}
