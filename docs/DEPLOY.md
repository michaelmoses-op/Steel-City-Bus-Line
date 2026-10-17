# Deploy: Vercel (web) + Railway (API, worker, Postgres, Redis)

Production layout:

| Component | Host | Notes |
|-----------|------|--------|
| Next.js web | **Vercel** | Root directory `apps/web` |
| Hono API | **Railway** | Docker `services/api/Dockerfile` |
| GTFS-RT worker | **Railway** | Docker `services/worker/Dockerfile` |
| Postgres + PostGIS | **Railway** | PostGIS Docker image (required for stops/shapes) |
| Redis | **Railway** | Plugin or Redis Docker image |

**Trip planner / OTP is off by default** (no OTP container, lower cost). Plan trip is hidden in the UI and `/api/v1/plan` returns 404 unless you set the feature flags in [`.env.example`](../.env.example).

---

## Prerequisites

- GitHub repo connected to Vercel and Railway
- [Railway CLI](https://docs.railway.app/develop/cli) (optional, for one-off GTFS import)
- Node 22 locally if you run import from your machine

---

## 1. Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repository.
2. You will add **four services** in one project (same private network):
   - PostGIS
   - Redis
   - API
   - Worker

### 1a. PostGIS (database)

Stock Railway Postgres may **not** include PostGIS. Use the official image:

1. **Add service** → **Empty service** (or **Docker image**).
2. **Settings** → **Source**: Docker image `postgis/postgis:16-3.4`.
3. **Variables** (service):
   - `POSTGRES_USER=steel_city`
   - `POSTGRES_PASSWORD=` (generate a strong password)
   - `POSTGRES_DB=steel_city`
4. **Volumes**: mount `/var/lib/postgresql/data` (Railway prompt when adding volume).
5. **Networking**: generate a **public** TCP proxy only if you need external access; otherwise keep private.
6. Build **`DATABASE_URL`** for other services (private hostname from Railway networking), e.g.  
   `postgresql://steel_city:PASSWORD@postgis.railway.internal:5432/steel_city`  
   (Use the exact host/port Railway shows for this service on the private network.)

### 1b. Redis

1. **Add service** → **Database** → **Redis**, or Docker image `redis:7-alpine`.
2. Copy **`REDIS_URL`** from the Redis service variables (often `redis://default:...@redis.railway.internal:6379`).

### 1c. API service

1. **Add service** → same repo → configure build:
   - **Builder**: Dockerfile
   - **Dockerfile path**: `services/api/Dockerfile`
   - **Root directory**: repository root (default)
2. **Variables** (shared or duplicated on API + worker):

   | Variable | Value |
   |----------|--------|
   | `PORT` | `4000` (Railway also sets `PORT`; app reads it) |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | from PostGIS service |
   | `REDIS_URL` | from Redis service |
   | `CORS_ORIGIN` | `https://YOUR-VERCEL-DOM.vercel.app` (add custom domain later, comma-separated) |
   | `ENABLE_TRIP_PLANNER` | `false` |
   | `PRT_GTFS_URL` | optional; see `.env.example` |
   | `PRT_GTFSRT_VEHICLES_URL` | see `.env.example` |
   | `PRT_GTFSRT_TRIPS_URL` | see `.env.example` |
   | `PRT_GTFSRT_ALERTS_URL` | see `.env.example` |

   Do **not** set `OTP_BASE_URL` for production unless you enable trip planning.

3. **Deploy**. On each deploy the API container runs **`pnpm db:migrate`** then starts the server.
4. **Settings** → **Networking** → **Generate domain** (public HTTPS URL for the API).  
   Example: `https://steel-city-api-production.up.railway.app`  
   Health check: `GET /health`

### 1d. Worker service

1. **Add service** → same repo:
   - **Dockerfile path**: `services/worker/Dockerfile`
2. **Variables**: same `DATABASE_URL`, `REDIS_URL`, `NODE_ENV`, and all `PRT_GTFSRT_*` URLs as the API (no `CORS_ORIGIN` required).
3. Optional tuning: `WORKER_POLL_INTERVAL_MS=15000`, `RT_SNAPSHOT_TTL_SEC=120`.
4. Deploy (no public domain needed).

### 1e. Shared variables (recommended)

In Railway **Project** → **Variables** → **Shared variables**, set `DATABASE_URL`, `REDIS_URL`, and PRT URLs once so API and worker both inherit them.

---

## 2. Load static GTFS (one time)

After PostGIS is up and API has run migrations at least once:

**Option A — Railway CLI** (from repo root, linked to the worker or API service):

```bash
railway link
railway run pnpm gtfs:import
```

Ensure the linked service has `DATABASE_URL` and network access to PostGIS.

**Option B — Local** (Postgres reachable via public proxy or VPN):

```bash
DATABASE_URL="postgresql://..." pnpm gtfs:import
```

Verify: open API `GET /api/v1/routes` (or the web **Routes** page after Vercel is wired).

Re-run import when PRT publishes a new GTFS bundle (monthly/quarterly).

---

## 3. Vercel (web)

1. [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo.
2. **Root Directory**: `apps/web` (monorepo).
3. **Framework**: Next.js (auto-detected).
4. **Build & install**: `apps/web/vercel.json` runs install/build from the repo root with pnpm.
5. **Environment variables** (Production + Preview as needed):

   | Variable | Value |
   |----------|--------|
   | `NEXT_PUBLIC_API_URL` | Railway API public URL (no trailing slash), e.g. `https://steel-city-api-production.up.railway.app` |
   | `NEXT_PUBLIC_ENABLE_TRIP_PLANNER` | `false` |
   | `NEXT_PUBLIC_MAP_STYLE` | optional; default Carto Voyager in code |

6. **Deploy**.

7. Copy the Vercel URL (e.g. `https://steel-city-bus-line.vercel.app`) into Railway API **`CORS_ORIGIN`**. Redeploy API if you change it.

### Custom domain (optional)

- Vercel: add domain in project settings.
- Add the same origin to `CORS_ORIGIN` on Railway (comma-separated if multiple).

---

## 4. Smoke test

1. Vercel home page loads; **Plan trip** is **not** in the nav.
2. `/plan` redirects to `/`.
3. API `GET /health` → `database: true`, `redis: true`.
4. **Routes** lists PRT routes; **Live map** shows buses (worker logs snapshot counts).
5. **Stops** → pick a stop → live arrivals (needs `PRT_GTFSRT_TRIPS_URL`).

---

## 5. Re-enable trip planning later (optional, higher cost)

1. Run OTP locally or deploy a separate OTP service (large JVM / RAM).
2. Set on Railway API: `ENABLE_TRIP_PLANNER=true`, `OTP_BASE_URL=...`, `GEOCODE_USER_AGENT=...`.
3. Set on Vercel: `NEXT_PUBLIC_ENABLE_TRIP_PLANNER=true`.
4. Redeploy API and web.

---

## 6. Cost notes (Railway Hobby)

Typical all-in Railway stack without OTP: PostGIS + Redis + API + worker ≈ **$15–25/mo** usage depending on memory limits; Hobby includes **$5** credit then usage billing. Merging API+worker into one container is possible later to save RAM but is not required for the first deploy.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| CORS / SSE errors on map | `CORS_ORIGIN` matches exact Vercel origin; `NEXT_PUBLIC_API_URL` points to Railway API |
| Empty routes | Run `pnpm gtfs:import`; `DATABASE_URL` on worker/API |
| No live buses | Worker running; `REDIS_URL`; PRT GTFS-RT URLs |
| Migrate fails on `postgis` | Database must be PostGIS image, not plain Postgres |
| API build fails | Dockerfile build context is **repo root**; path `services/api/Dockerfile` |
