# Build from repository root:
#   docker build -f services/worker/Dockerfile -t steel-city-worker .
FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY services/worker ./services/worker

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @steel-city/worker... build

FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/worker ./services/worker
COPY --from=build /app/node_modules ./node_modules

CMD ["pnpm", "--filter", "@steel-city/worker", "start"]
