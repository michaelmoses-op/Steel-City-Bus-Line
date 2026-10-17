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

### If you see four GitHub cards (`@steel-city/api`, `web`, `worker`, `mobile`)

Railway **auto-detected the monorepo** and created one service per package. That is normal. You still **add databases separately** — they do not appear from GitHub import.

**Keep on Railway:** `@steel-city/api`, `@steel-city/worker`  
**Remove from Railway** (use Vercel / not deployed yet): `@steel-city/web`, `@steel-city/mobile`

1. Open **`@steel-city/web`** → **Settings** → scroll to **Danger** → **Delete service**. Repeat for **`mobile`**.
2. Configure **api** and **worker** (Dockerfiles below). Ignore the yellow **“N Settings”** badge until source/build is set.

**Add PostGIS + Redis** (not in the repo):

- **Create** (top-right of the project, or **⌘/Ctrl+K** → “Empty service” / “Database”) — *not* on the canvas cards themselves.
- If you do not see **Create**: click the **project name** in the top breadcrumb so you are on the **project canvas** (not inside a single service’s logs). The **+ Create** control lives on that view.
- Pick **Empty service** (PostGIS Docker image) or **Database → Redis**. For Postgres, prefer the PostGIS image in [1a](#1a-postgis-database); Railway’s default Postgres may lack the `postgis` extension.

Target **four services** when done: **PostGIS**, **Redis**, **api**, **worker** (web/mobile deleted).

### 1a. PostGIS (Docker Hub — not GitHub)

**Yes:** the database runs from **[Docker Hub](https://hub.docker.com/r/postgis/postgis)** image  
`postgis/postgis:16-3.4`  
(not from your GitHub repo). Railway’s **“Add PostgreSQL”** template often **lacks PostGIS**; this image includes it.

**A. Create the service (use “Docker Image”, not a clickable search link)**

Railway’s image search shows names that **link to Docker Hub** — clicking them does **not** set the source. You must **type** the image and confirm with **Enter**, then **Deploy**.

1. Open your project **architecture canvas**.
2. Top-right: **Create** (or **+ New**).
3. Choose **Docker Image** (not “Empty service” first — that path is easy to get wrong).
4. In the **Image name** field, **type** (do not click search results):

   `postgis/postgis:16-3.4`

5. Press **Enter**, then click **Deploy** (or **Add service**).

Railway creates a new service and pulls from [Docker Hub `postgis/postgis`](https://hub.docker.com/r/postgis/postgis). Wait until **Deployments** shows success.

**If you already made an Empty service:** open it → **Settings** → **Source** → switch to **Docker Image** → type `postgis/postgis:16-3.4` in the text field → **Enter** → **Deploy**. Do not click the Docker Hub hyperlink.

**CLI alternative** (from a linked project): `railway add --image postgis/postgis:16-3.4`

**C. Variables (same service → Variables tab)**

Click **Variables** (top tabs on that service, next to Settings):

| Name | Value |
|------|--------|
| `POSTGRES_USER` | `steel_city` |
| `POSTGRES_PASSWORD` | long random password (Railway can generate) |
| `POSTGRES_DB` | `steel_city` |

Redeploy if Railway prompts you after saving variables.

**D. Volume (Settings → Mount path)**

1. **Settings** tab again → **Volumes** (or **Storage**).
2. **Add volume** → mount path: `/var/lib/postgresql/data`  
   (required so data survives redeploys).

**E. `DATABASE_URL` for api + worker (private host is not on the Networking page)**

On PostGIS, **Settings → Networking** usually shows only **Public** options (Generate Domain, TCP Proxy). That is normal. **Private** DNS is not listed there; it exists as the variable **`RAILWAY_PRIVATE_DOMAIN`** on the PostGIS service at runtime.

1. Note the **exact service name** on the canvas card (e.g. `postgis`, `PostGIS`, or an auto name like `postgis-production-a1b2`). You need this spelling for references.
2. On **`@steel-city/api`** → **Variables** → **+ New Variable** (or **Raw Editor**).
3. Add **`DATABASE_URL`** with this value (replace `YOUR_POSTGIS_SERVICE_NAME` with the name from step 1 — no spaces):

   ```text
   postgresql://steel_city:${{YOUR_POSTGIS_SERVICE_NAME.POSTGRES_PASSWORD}}@${{YOUR_POSTGIS_SERVICE_NAME.RAILWAY_PRIVATE_DOMAIN}}:5432/steel_city
   ```

   Example if the card is named `postgis`:

   ```text
   postgresql://steel_city:${{postgis.POSTGRES_PASSWORD}}@${{postgis.RAILWAY_PRIVATE_DOMAIN}}:5432/steel_city
   ```

   In the UI, typing `${{` often opens a picker to choose the PostGIS service and variable.

4. Add the **same** `DATABASE_URL` on **`@steel-city/worker`** (or set it once under **Project → Shared Variables**).

Do **not** use **Generate Domain** or **TCP Proxy** on PostGIS unless you need to connect from your laptop; api/worker should use the reference URL above on the private network.

**F. Optional rename**

Service **Settings** → **General** → rename the service to `postgis` so the canvas is readable.

### 1b. Redis (Railway template — not GitHub)

1. Back on the **project canvas** → **Create** again.
2. Choose **Database** → **Add Redis** (Railway-managed plugin).
3. Click the new **Redis** service → **Variables** tab.
4. Copy **`REDIS_URL`** (or **`REDIS_PRIVATE_URL`** if shown — prefer the URL meant for other services in the same project).
5. Paste into **api** and **worker** variables (or project **Shared Variables**).

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
