import type { ReactNode } from "react";

type Props = {
  showRouteLegs: boolean;
  showLive: boolean;
  liveBusCount: number;
};

function LegendItem({
  swatch,
  children,
}: {
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-2">
      <span className="flex h-3.5 w-5 shrink-0 items-center justify-center">{swatch}</span>
      <span>{children}</span>
    </li>
  );
}

export function PlanTripMapLegend({ showRouteLegs, showLive, liveBusCount }: Props) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
      <LegendItem swatch={<span className="h-2.5 w-2.5 rounded-full bg-pgh-gold" />}>From</LegendItem>
      <LegendItem swatch={<span className="h-2.5 w-2.5 rounded-full bg-zinc-100" />}>To</LegendItem>
      {showRouteLegs && (
        <>
          <LegendItem swatch={<span className="h-0.5 w-5 rounded-full bg-pgh-gold" />}>Bus</LegendItem>
          <LegendItem
            swatch={<span className="h-0 w-5 border-b-2 border-dashed border-zinc-400" aria-hidden />}
          >
            Walk
          </LegendItem>
        </>
      )}
      {showLive && (
        <LegendItem
          swatch={
            <span className="h-2.5 w-2.5 rounded-full bg-pgh-gold ring-2 ring-black ring-offset-1 ring-offset-black" />
          }
        >
          <span className="inline-flex flex-wrap items-center gap-x-1">
            <span>Live</span>
            {liveBusCount > 0 ? (
              <span className="text-zinc-500">
                · {liveBusCount} {liveBusCount === 1 ? "bus" : "buses"} on your routes
              </span>
            ) : (
              <span className="text-zinc-500">· no buses on map for these routes yet</span>
            )}
          </span>
        </LegendItem>
      )}
    </ul>
  );
}
