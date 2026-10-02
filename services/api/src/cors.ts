const DEFAULT_ORIGIN = "http://localhost:3000";

function isDevLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/** Reflect the request origin when allowed (needed for EventSource / fetch from the web app). */
export function resolveCorsOrigin(origin: string | undefined): string {
  const configured = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [DEFAULT_ORIGIN];

  if (!origin) {
    return configured[0] ?? DEFAULT_ORIGIN;
  }
  if (configured.includes(origin)) {
    return origin;
  }
  if (process.env.NODE_ENV !== "production" && isDevLoopbackOrigin(origin)) {
    return origin;
  }
  return configured[0] ?? DEFAULT_ORIGIN;
}
