# Steel City Bus Line

A Pittsburgh metro transit app focused on **accurate routes**, **live vehicle locations**, and a **better map UX** than official tools. Web first; iOS/Android via Expo later.

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
pnpm db:up
pnpm db:migrate
pnpm gtfs:import      # downloads PRT GTFS.zip into Postgres (~1–2 min)

pnpm dev
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

## Status

Phase 2 static GTFS complete. Next: Phase 3 realtime GTFS-RT — see [AGENTS.md](./AGENTS.md).
