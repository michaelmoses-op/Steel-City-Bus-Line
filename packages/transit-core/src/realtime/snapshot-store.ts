import type { RealtimeSnapshot } from "./types.js";
import { REDIS_KEYS } from "./redis-keys.js";

export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
};

const SNAPSHOT_TTL_SEC = Number(process.env.RT_SNAPSHOT_TTL_SEC ?? 120);

export async function writeSnapshot(redis: RedisLike, snapshot: RealtimeSnapshot): Promise<void> {
  await redis.set(REDIS_KEYS.snapshot, JSON.stringify(snapshot), { EX: SNAPSHOT_TTL_SEC });
}

export async function readSnapshot(redis: RedisLike): Promise<RealtimeSnapshot | null> {
  const raw = await redis.get(REDIS_KEYS.snapshot);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<RealtimeSnapshot>;
  return {
    vehicles: parsed.vehicles ?? [],
    alerts: parsed.alerts ?? [],
    tripPredictions: parsed.tripPredictions ?? [],
    fetchedAt: parsed.fetchedAt ?? new Date().toISOString(),
  };
}
