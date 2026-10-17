# Build from repository root:
#   docker build -f services/api/Dockerfile -t steel-city-api .
FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY services/api ./services/api
COPY services/worker ./services/worker

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @steel-city/api... build
RUN pnpm --filter @steel-city/worker... build

FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/api ./services/api
COPY --from=build /app/services/worker ./services/worker
COPY --from=build /app/node_modules ./node_modules

EXPOSE 4000

# One-off GTFS import on Railway (Custom Start Command on the API service, then clear and redeploy):
#   node services/worker/dist/import-gtfs.js
CMD ["sh", "-c", "pnpm --filter @steel-city/db migrate && exec pnpm --filter @steel-city/api start"]
