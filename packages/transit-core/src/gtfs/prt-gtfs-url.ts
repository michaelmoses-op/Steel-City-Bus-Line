export const PRT_GTFS_DEV_PAGE =
  "https://rideprt.org/business-resources/web-developer-resources/";

/** Removed from rideprt.org; kept so we can detect stale .env values. */
export const PRT_GTFS_LEGACY_URL = "https://www.rideprt.org/developerresources/GTFS.zip";

/** CMS-hosted zip linked from the developer page (asset id may change when PRT publishes a new bundle). */
export const PRT_GTFS_DEFAULT_URL =
  "https://rideprt.org/contentassets/1bda11b1f5f1408d8e8f99db6d5ebe75/gtfs.zip";

async function gtfsZipReachable(url: string): Promise<boolean> {
  const head = await fetch(url, { method: "HEAD", redirect: "follow" });
  if (head.ok) return true;
  if (head.status === 404 || head.status === 410) return false;
  const probe = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { Range: "bytes=0-0" },
  });
  return probe.ok || probe.status === 206;
}

/** Parse the current static GTFS zip URL from PRT’s developer resources page. */
export async function discoverPrtGtfsUrlFromDevPage(): Promise<string | null> {
  const res = await fetch(PRT_GTFS_DEV_PAGE, { redirect: "follow" });
  if (!res.ok) return null;
  const html = await res.text();
  const rel = html.match(/href="(\/contentassets\/[^"]+\/gtfs\.zip)"/i)?.[1];
  if (!rel) return null;
  return new URL(rel, "https://rideprt.org").href;
}

/**
 * Pick a working static GTFS zip URL: env override, then default, then live scrape of the dev page.
 */
export async function resolvePrtGtfsUrl(preferred?: string | null): Promise<string> {
  const fromEnv = preferred ?? process.env.PRT_GTFS_URL ?? null;
  const candidates = [...new Set([fromEnv, PRT_GTFS_DEFAULT_URL].filter(Boolean) as string[])];

  for (const url of candidates) {
    if (!(await gtfsZipReachable(url))) {
      if (fromEnv && url === fromEnv) {
        console.warn(`[gtfs] PRT_GTFS_URL unavailable (${url}); trying fallbacks…`);
      }
      continue;
    }
    if (fromEnv && url !== fromEnv) {
      console.warn(`[gtfs] using ${url} — update PRT_GTFS_URL in .env (see ${PRT_GTFS_DEV_PAGE})`);
    }
    return url;
  }

  const discovered = await discoverPrtGtfsUrlFromDevPage();
  if (discovered && (await gtfsZipReachable(discovered))) {
    console.warn(`[gtfs] using GTFS URL from developer page: ${discovered}`);
    return discovered;
  }

  throw new Error(
    `Could not download PRT GTFS. Set PRT_GTFS_URL to the zip from ${PRT_GTFS_DEV_PAGE}`,
  );
}
