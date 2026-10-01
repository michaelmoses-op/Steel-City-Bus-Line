import { Suspense } from "react";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="text-zinc-500">Loading map…</p>}>{children}</Suspense>;
}
