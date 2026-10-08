"use client";

import { useSearchParams } from "next/navigation";
import { LiveMap } from "@/components/live-map";
import { PageHeading } from "@/components/page-heading";
import { RouteAlertsPanel } from "@/components/route-alerts-panel";

export default function MapPage() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") ?? undefined;

  return (
    <div>
      <PageHeading
        title="Live map"
        subtitle={
          <>
            Positions refresh over SSE. Stale GPS (&gt;2 min) is removed server-side.
            {route && (
              <>
                {" "}
                Showing route <strong className="text-pgh-gold">{route}</strong> only.
              </>
            )}
          </>
        }
      />
      {route && <RouteAlertsPanel routeId={route} className="mt-4" />}

      <div className="mt-6">
        <LiveMap routeId={route} />
      </div>
    </div>
  );
}
