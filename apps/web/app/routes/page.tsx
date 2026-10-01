"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";

export default function RoutesPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.getRoutes(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (r) =>
        r.routeId.toLowerCase().includes(term) ||
        (r.routeShortName?.toLowerCase().includes(term) ?? false) ||
        (r.routeLongName?.toLowerCase().includes(term) ?? false),
    );
  }, [data, q]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Routes</h1>
      <input
        type="search"
        placeholder="Search by number or name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-4 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
      />

      {isLoading && <p className="mt-4 text-zinc-500">Loading…</p>}
      {error && <p className="mt-4 text-red-400">{String(error)}</p>}

      <ul className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {filtered.map((r) => (
          <li key={r.routeId}>
            <Link
              href={`/routes/${encodeURIComponent(r.routeId)}`}
              className="flex items-baseline gap-3 px-4 py-3 hover:bg-zinc-900/80"
            >
              <span
                className="min-w-[3rem] rounded px-2 py-0.5 text-center text-sm font-bold text-zinc-950"
                style={{
                  backgroundColor: r.routeColor ? `#${r.routeColor}` : "#f59e0b",
                }}
              >
                {r.routeShortName ?? r.routeId}
              </span>
              <span className="text-zinc-300">{r.routeLongName ?? "Unnamed route"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
