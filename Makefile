# Steel City Bus Tracker — convenience targets over pnpm scripts.
# Requires: Node 22+, pnpm 9, Docker (for db/OTP), and GNU Make.
# On Windows: use Git Bash or WSL for `make` (or run the pnpm commands from README).

PNPM ?= pnpm

.PHONY: help install env build-packages build dev db-up db-down migrate gtfs-import setup update typecheck lint otp-fetch-gtfs otp-build otp-up otp-down

.DEFAULT_GOAL := help

help:
	@echo Steel City Bus Tracker
	@echo.
	@echo   make setup          First-time: .env, install, packages, DB, GTFS import
	@echo   make update         Pull, install, build packages, start DB, migrate
	@echo   make dev            Start DB + web :3000, API :4000, worker
	@echo   make install        pnpm install
	@echo   make env            Copy .env.example to .env if missing
	@echo   make build-packages Build packages/*
	@echo   make build          Production build
	@echo   make db-up          Start Postgres + Redis (Docker)
	@echo   make db-down        Stop Docker services
	@echo   make migrate        Apply SQL migrations
	@echo   make gtfs-import    Import PRT static GTFS
	@echo   make typecheck      TypeScript across workspace
	@echo   make lint           Lint
	@echo   make otp-fetch-gtfs Fetch GTFS for OTP
	@echo   make otp-build      Build OTP graph (long, Docker)
	@echo   make otp-up         Start OTP on http://127.0.0.1:8080
	@echo   make otp-down       Stop OTP

env:
ifeq ($(OS),Windows_NT)
	@if not exist .env copy .env.example .env
else
	@test -f .env || cp .env.example .env
endif

install:
	$(PNPM) install

build-packages:
	$(PNPM) build:packages

build:
	$(PNPM) build

dev: db-up
	$(PNPM) dev

db-up:
	$(PNPM) db:up
	node scripts/db-wait.mjs

db-down:
	$(PNPM) db:down

migrate: db-up
	$(PNPM) db:migrate

gtfs-import:
	$(PNPM) gtfs:import

setup: env install build-packages db-up migrate gtfs-import
	@echo.
	@echo Setup complete. Run: make dev

update:
	git pull --ff-only
	$(MAKE) install build-packages migrate
	@echo.
	@echo Update complete. Run: make dev

typecheck:
	$(PNPM) typecheck

lint:
	$(PNPM) lint

otp-fetch-gtfs:
	$(PNPM) otp:fetch-gtfs

otp-build:
	$(PNPM) otp:build

otp-up:
	$(PNPM) otp:up

otp-down:
	$(PNPM) otp:down
