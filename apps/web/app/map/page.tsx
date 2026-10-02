"use client";

import { useSearchParams } from "next/navigation";
import { LiveMap } from "@/components/live-map";
import { RouteAlertsPanel } from "@/components/route-alerts-panel";

export default function MapPage() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") ?? undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-50">Live map</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Positions refresh over SSE. Stale GPS (&gt;2 min) is removed server-side.
        {route && (
          <>
            {" "}
            Showing route <strong className="text-[#FFB612]">{route}</strong> only.
          </>
        )}
      </p>
      {route && <RouteAlertsPanel routeId={route} className="mt-4" />}

      <div className="mt-6">
        <LiveMap routeId={route} />
      </div>
    </div>
  );
}
