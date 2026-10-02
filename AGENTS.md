# Agent & contributor guide

Instructions for **Cursor agents** (including sessions started from a phone) and humans continuing work on **Steel City Bus Line**. Read this file first, then [ARCHITECTURE.md](./ARCHITECTURE.md) for technical boundaries.

---

## Project intent

Build a **better Pittsburgh-area transit experience**: reliable route/stop info, live vehicle positions, and strong map UX. Official apps often have wrong line info, weak live tracking, and poor interactivity—our edge is **presentation + a server-side “truth layer”** over PRT GTFS/GTFS-RT (staleness, labeling, detour messaging where feeds are incomplete).

**Stack:** Option 1 — Next.js web + Hono API/worker + Postgres/PostGIS + Redis + Expo mobile later. Details in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Before you write code

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) (stack, data flow, folder layout).
2. Check **Implementation status** below — pick the next unchecked item or the user’s explicit task.
3. Match existing conventions once scaffold exists (pnpm, TypeScript strict, minimal diff).
4. Do **not** commit secrets (`.env`, API keys). Use `.env.example` with placeholder names only.
5. At end of session: update **Implementation status**, **Current focus**, and **Session log** in this file.

---

## Implementation status

Use `[x]` when done, `[ ]` when not started, `[~]` when in progress.

### Phase 0 — Documentation & repo

- [x] ARCHITECTURE.md
- [x] AGENTS.md (this file)
- [x] README.md quick start (install, dev commands)
- [x] `.env.example` documenting required env vars
- [x] `.gitignore` (node, .env, .next, dist, etc.)

### Phase 1 — Monorepo scaffold

- [x] Root `package.json` + `pnpm-workspace.yaml`
- [x] `packages/shared` — base types + Zod placeholders
- [x] `packages/transit-core` — empty module boundaries documented in README
- [x] `packages/api-client` — base URL + fetch wrapper
- [x] `services/api` — Hono hello + health route
- [x] `services/worker` — stub poll loop (or merged into `services/api` for v1)
- [x] `apps/web` — Next.js App Router + Tailwind + health check page
- [x] `apps/mobile` — Expo stub README (“not started”) or minimal `expo init` shell

### Phase 2 — Static GTFS

- [x] Download/import script for PRT GTFS.zip
- [x] Postgres + PostGIS schema (routes, stops, trips, shapes)
- [x] API: `GET /routes`, `GET /routes/:id`, `GET /stops/nearby`

### Phase 3 — Realtime GTFS-RT

- [x] Decode bus vehicle + trip update feeds
- [x] Redis snapshot writer + TTL (vehicles, alerts, trip predictions)
- [x] API: `GET /vehicles`, SSE `GET /vehicles/stream`
- [x] API: `GET /stops/:id/arrivals` (trip-update predictions)
- [x] `transit-core` staleness / missing vehicle rules

### Phase 4 — Web UX

- [x] Map page (MapLibre or Mapbox)
- [x] Route list + detail (static timetable sample, live map per route)
- [x] Stop board / nearby stops + **live arrivals** on stop detail
- [x] Alerts surface + **route-scoped alerts** on route detail / filtered map
- [x] Pittsburgh UI (nav, steel panels, checkered bands)
- [x] Routes page: **Live now** section + green live pill + bus counts
- [x] Mobile-friendly nav (hamburger below `lg`)
- [x] Browser → API direct + dev CORS (SSE; avoid Next rewrite for RT)

### Phase 4b — Web deploy polish (before mobile)

- [ ] Production deploy (web + API + worker + Postgres + Redis) — document host/env
- [ ] CI: `pnpm typecheck` / `lint` on PRs
- [ ] Unit tests for `transit-core` arrivals + alert filtering
- [ ] Optional: map alert banner when not filtering by route; trip headsign on arrivals

### Phase 5 — Mobile (Expo)

- [ ] `apps/mobile` Expo Router app
- [ ] Wire `api-client`; map + live vehicles
- [ ] EAS / store prep (document in README; no paid tiers required for dev)

---

## Current focus

**Phase:** 4b (Web deploy polish — **no mobile yet**)

**Active goal:** Polish and validate web for initial deployment. Michael testing desktop + mobile viewport in devtools.

**Blockers:** None documented. Ensure `.env` includes `PRT_GTFSRT_TRIPS_URL` for live stop arrivals.

**Last updated:** 2026-10-02

---

## Session log

Append a short entry after each meaningful agent session (newest first).

| Date | Author | Summary |
|------|--------|---------|
| 2026-10-02 | — | Trip updates ingest; stop arrivals API/UI; route alerts on route/map; routes live section; map SSE/CORS fix; mobile nav; AGENTS Phase 4b |
| 2026-10-01 | — | Phase 3–4: GTFS-RT/Redis, live API, MapLibre web (map, routes, stops, alerts) |
| 2026-10-01 | — | Phase 2: PostGIS docker (host **5433**), Drizzle, GTFS import, routes/stops API |
| 2026-10-01 | — | Phase 0–1: pnpm monorepo, Hono API, worker, Next web, mobile README stub |
| 2026-10-01 | — | Added ARCHITECTURE.md, AGENTS.md; Option 1 stack |

---

## Changelog (architecture / process)

| Date | Change |
|------|--------|
| 2026-10-02 | Trip-update snapshot + stop arrivals; web polish checklist (Phase 4b) |
| 2026-10-01 | Initial architecture and agent handoff docs |

---

## Monorepo map (quick reference)

| Path | Responsibility |
|------|----------------|
| `apps/web` | Next.js UI only; calls API via `api-client` |
| `apps/mobile` | Expo; same API client; native maps |
| `services/api` | Hono routes, SSE, CORS |
| `services/worker` | GTFS import + GTFS-RT polling → Redis/Postgres |
| `packages/db` | Drizzle schema, Postgres client, SQL migrations |
| `packages/transit-core` | No HTTP; pure domain + GTFS/RT logic |
| `packages/api-client` | Shared client for web + mobile |
| `packages/shared` | Zod schemas, shared types |

**Rule:** PRT feeds are consumed only in `worker` (or api ingest module), never in `apps/web` or `apps/mobile`.

---

## Environment variables (planned)

Document in `.env.example` when scaffold exists. Expected names:

| Variable | Used by | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | api, worker | Postgres connection |
| `REDIS_URL` | api, worker | Redis connection |
| `PRT_GTFS_URL` | worker | Static GTFS zip URL |
| `PRT_GTFSRT_VEHICLES_URL` | worker | Bus vehicles feed |
| `PRT_GTFSRT_TRIPS_URL` | worker | Bus trip updates feed |
| `PRT_GTFSRT_ALERTS_URL` | worker | Alerts feed |
| `API_PUBLIC_URL` | web, api-client | Browser-accessible API base |
| `MAPBOX_TOKEN` or tile config | web, mobile | Map tiles (if using Mapbox) |

---

## Commands (fill in when scaffold exists)

```bash
pnpm install
pnpm build:packages   # optional first run; turbo dev runs ^build on deps
pnpm db:up            # Docker PostGIS
pnpm db:migrate
pnpm gtfs:import      # PRT GTFS.zip → Postgres
pnpm dev              # web :3000, api :4000, worker stub logs

pnpm lint
pnpm typecheck
pnpm build
```

---

## Conventions for agents

- **Minimize scope:** One phase or one endpoint at a time unless the user asks for more.
- **TypeScript strict** across packages; share types via `packages/shared` / `transit-core`.
- **API versioning:** Prefix public routes with `/api/v1`.
- **Errors:** Consistent JSON error shape from Hono; no stack traces to clients in production.
- **Tests:** Add when requested or when covering non-trivial `transit-core` logic.
- **Commits:** Only when the user asks (see user git rules).

---

## Developing from a phone (Cursor agent)

Phone sessions work best for **bounded tasks** that do not require local emulators. Plan work accordingly and leave clear handoff notes here.

### Good tasks from phone

- Implement or extend **Hono routes** and `transit-core` logic
- **Zod schemas**, `api-client` methods, TypeScript types
- **Next.js** pages/components (map aside if no visual verify)
- Documentation updates (**AGENTS.md** status, ARCHITECTURE.md)
- SQL migrations, Drizzle schema, GTFS import scripts (logic review)
- Unit tests for pure functions in `transit-core`

### Usually needs desktop (or cloud Mac for iOS)

- Android emulator / `expo run:android`
- iOS simulator / device builds
- First-time **Postgres/Redis** via Docker if not using cloud dev DB
- Heavy map interaction QA (performance, gestures)
- EAS iOS cloud build setup (account linking)

### Phone session workflow

1. User opens repo in **Cursor mobile / cloud agent** and references: *“Read AGENTS.md and continue Phase X.”*
2. Agent reads **Current focus** + **Implementation status** + [ARCHITECTURE.md](./ARCHITECTURE.md).
3. Agent implements **one checklist slice**; runs lint/typecheck if environment allows.
4. Agent updates:
   - **Implementation status** checkboxes
   - **Current focus** (phase, goal, blockers)
   - **Session log** row
5. If stopped mid-task: set `[~]` on item and write **Blockers** under Current focus with exact next step.

### Prompt templates (copy from phone)

**Continue default work**

> Read AGENTS.md and ARCHITECTURE.md. Continue the next unchecked item in Implementation status. Update AGENTS.md when done.

**Scoped feature**

> Read AGENTS.md. Implement [e.g. GET /api/v1/routes] in services/api using transit-core. Do not change apps/mobile. Update session log.

**Handoff after desktop**

> I finished [X] locally. Read AGENTS.md session log and continue from Phase [N].

---

## User preferences (Michael)

- Software engineer; prefers **working in code** directly.
- **Option 1 stack** locked unless ARCHITECTURE.md changelog says otherwise.
- Infra cost: OK to pay for **deployment**; avoid required **monthly dev subscriptions** (Expo EAS optional; local Android builds fine on Windows).

---

## Related files

| File | Role |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, diagrams, data flow, API list |
| [README.md](./README.md) | Human-facing intro and commands |

When in doubt: **architecture → AGENTS status → smallest implementable step**.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
