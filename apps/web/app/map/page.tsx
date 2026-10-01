"use client";

import { useSearchParams } from "next/navigation";
import { LiveMap } from "@/components/live-map";

export default function MapPage() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") ?? undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Live map</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Vehicle positions refresh over SSE. Stale GPS (&gt;2 min) is dropped server-side.
        {route && (
          <>
            {" "}
            Filtering route <strong className="text-amber-400">{route}</strong>.
          </>
        )}
      </p>
      <div className="mt-6">
        <LiveMap routeId={route} />
      </div>
    </div>
  );
}
