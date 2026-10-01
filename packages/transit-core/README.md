# @steel-city/transit-core

Pure domain logic for Steel City Bus Line. **Must not import** Hono, Next.js, React, or fetch.

## Planned modules (Phase 2+)

| Module | Responsibility |
|--------|----------------|
| `gtfs/static` | Parse PRT GTFS.zip → normalized entities |
| `gtfs/realtime` | Decode GTFS-RT protobuf → vehicle/trip/alerts |
| `merge` | Join static trips with realtime updates |
| `quality` | Stale GPS, missing vehicles, user-facing detour notes |

## Consumers

- `services/worker` — ingest and write Postgres/Redis
- `services/api` — read stores and shape API responses
