# Steel City Bus Tracker

A Pittsburgh metro transit app focused on **accurate PRT routes**, **live vehicle locations**, and a **better map UX**. Web first; iOS/Android via Expo later.

## Documentation

| Doc | Audience |
|-----|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, data flow diagrams, monorepo layout, API plan |
| [AGENTS.md](./AGENTS.md) | Cursor agents & phone sessions: status, conventions, handoff |

**Agents:** start with [AGENTS.md](./AGENTS.md), then [ARCHITECTURE.md](./ARCHITECTURE.md).

## Prerequisites

- **Node.js 22+**
- **pnpm 9** ([install](https://pnpm.io/installation)) — or use `npx pnpm@9.15.9` instead of `pnpm` below

## Quick start

```bash
# From repo root
cp .env.example .env

pnpm install
pnpm build:packages   # first time; turbo dev also builds deps via ^build

# Database + PRT static schedule (Phase 2)
pnpm db:up            # Postgres + Redis
pnpm db:migrate
pnpm gtfs:import      # downloads PRT GTFS.zip into Postgres (~1–2 min)

pnpm dev              # web, API, worker (GTFS-RT poll → Redis)
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API health | http://localhost:4000/api/v1/health |

The home page calls the API via `@steel-city/api-client` and shows JSON when the API is up.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Web + API + worker + package watch (excludes mobile stub) |
| `pnpm build` | Production builds |
| `pnpm build:packages` | Build `packages/*` only |
| `pnpm db:up` / `db:down` | Start/stop PostGIS via Docker |
| `pnpm db:migrate` | Apply SQL migrations |
| `pnpm gtfs:import` | Download & import PRT GTFS |
| `pnpm typecheck` | TypeScript across workspace |
| `pnpm lint` | Lint where configured |

## Stack (summary)

Next.js · Hono (Node) · PostgreSQL/PostGIS · Redis · Expo (mobile, later) · TypeScript monorepo (pnpm).

## Production deploy

Step-by-step **Vercel + Railway** (Postgres/PostGIS, Redis, API, worker; trip planner off): [docs/DEPLOY.md](./docs/DEPLOY.md).

## Trip planning (OpenTripPlanner, optional / local)

The **Plan trip** page is **disabled in production by default** (`ENABLE_TRIP_PLANNER` / `NEXT_PUBLIC_ENABLE_TRIP_PLANNER`). For local dev, set both to `true` and use the API → OpenTripPlanner (`OTP_BASE_URL`). One-time setup:

```bash
# From repo root (Docker Desktop running)
pnpm otp:fetch-gtfs    # PRT GTFS.zip → infra/otp/gtfs/
pnpm otp:build         # downloads PA OSM, clips to Pittsburgh bbox, builds graph (~10–25 min, Docker ≥4GB RAM)
pnpm otp:up            # OTP on http://127.0.0.1:8080
```

`otp:build` runs `otp:prepare-osm` (one-time ~300MB PA download, then a small Pittsburgh extract). If build fails with **Java heap space**, raise Docker Desktop memory (Settings → Resources) or set `JAVA_TOOL_OPTIONS=-Xmx6g` on the `otp` service in `docker-compose.yml`.

After changing OSM/GTFS inputs, delete `infra/otp/graph.obj` and run `pnpm otp:build` again.

Ensure `.env` has `OTP_BASE_URL=http://127.0.0.1:8080`, then restart `pnpm dev`.

When PRT publishes a new GTFS bundle, run `pnpm otp:fetch-gtfs` and `pnpm otp:build` again, then `pnpm otp:up`.

Geocoding uses OpenStreetMap Nominatim via the API — set a real `GEOCODE_USER_AGENT` in production.

## Status

**Web app** — live map, routes, stops, alerts, trip planner UI (OTP required for results). Mobile (Expo) not started. See [AGENTS.md](./AGENTS.md).
