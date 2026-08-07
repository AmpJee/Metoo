# Metoo — task runner.
# Run `make` with no arguments to see everything available.

SHELL := /bin/bash
BACKEND := apps/backend
FRONTEND := apps/frontend
COMPOSE := docker compose

.DEFAULT_GOAL := help
.PHONY: help env install dev dev-backend dev-frontend \
        db-generate db-migrate db-deploy db-seed db-demo db-prune db-prune-apply \
	db-studio db-reset \
        lint format format-check typecheck check \
        up down build logs ps restart sh-backend sh-frontend clean

## ---------------------------------------------------------------- Setup ----

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "; print "\nUsage: make <target>\n"} \
		/^## -+ .* -+$$/ {gsub(/^## -+ | -+$$/, ""); printf "\n\033[1m%s\033[0m\n", $$0} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

env: ## Create .env files from .env.example (never overwrites)
	@for app in $(BACKEND) $(FRONTEND); do \
		if [ -f "$$app/.env" ]; then \
			echo "  exists  $$app/.env (left alone)"; \
		else \
			cp "$$app/.env.example" "$$app/.env"; \
			echo "  created $$app/.env"; \
		fi; \
	done
	@echo ""
	@echo "Now open $(BACKEND)/.env and set DATABASE_URL and DIRECT_URL"
	@echo "from your Supabase project (Settings > Database > Connection string)."

install: ## Install all workspace dependencies
	bun install

## ------------------------------------------------------------ Develop ------

dev: ## Run backend and frontend together with hot reload
	bun run dev

dev-backend: ## Run only the API (http://localhost:3000)
	cd $(BACKEND) && bun run dev

dev-frontend: ## Run only the web app (http://localhost:5173)
	cd $(FRONTEND) && bun run dev

## ----------------------------------------------------------- Database ------

db-generate: ## Regenerate the Prisma client (needed after schema edits)
	cd $(BACKEND) && bun run db:generate

db-migrate: ## Create and apply a migration in development
	cd $(BACKEND) && bun run db:migrate

db-deploy: ## Apply pending migrations without generating new ones (production)
	cd $(BACKEND) && bun run db:deploy

db-seed: ## Insert the sample rows
	cd $(BACKEND) && bun run db:seed

db-demo: ## Add realistic trading history for demos (needs db-seed first)
	cd $(BACKEND) && bun run db:demo

db-prune: ## Show what pruning demo data would remove (dry run)
	cd $(BACKEND) && bun run prisma/prune-demo-data.ts

db-prune-apply: ## DESTRUCTIVE — remove demo data, keeping only the named accounts
	cd $(BACKEND) && bun run prisma/prune-demo-data.ts --apply

db-studio: ## Browse the database in Prisma Studio
	cd $(BACKEND) && bun run db:studio

db-reset: ## DESTRUCTIVE — drop the database, re-run every migration, reseed
	@echo "This DROPS ALL DATA in the database that DIRECT_URL points at."
	@read -p "Type the word yes to continue: " ok; [ "$$ok" = "yes" ] || { echo "Aborted."; exit 1; }
	cd $(BACKEND) && bun run db:reset

## ------------------------------------------------------------ Quality ------

lint: ## Run ESLint across every workspace
	bun run lint

format: ## Rewrite files with Prettier
	bun run format

format-check: ## Fail if anything is unformatted (what CI runs)
	bun run format:check

typecheck: ## Run tsc across every workspace
	bun run typecheck

check: lint format-check typecheck ## Run every quality gate

## ------------------------------------------------------------- Docker ------

build: ## Build both images
	$(COMPOSE) build

up: ## Start both services in the background
	$(COMPOSE) up -d
	@echo ""
	@echo "  web  http://localhost:5173"
	@echo "  api  http://localhost:3000"
	@echo "  docs http://localhost:3000/openapi"

down: ## Stop and remove the containers
	$(COMPOSE) down

restart: down up ## Restart both services

logs: ## Follow logs from both services
	$(COMPOSE) logs -f

ps: ## Show container status
	$(COMPOSE) ps

sh-backend: ## Open a shell in the running backend container
	$(COMPOSE) exec backend sh

sh-frontend: ## Open a shell in the running frontend container
	$(COMPOSE) exec frontend sh

clean: ## Remove containers, images, build caches and node_modules
	-$(COMPOSE) down --rmi local --volumes --remove-orphans
	rm -rf node_modules .turbo
	find apps packages -maxdepth 2 -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true
	find apps packages -maxdepth 2 -name .turbo -type d -exec rm -rf {} + 2>/dev/null || true
	rm -rf $(BACKEND)/src/generated
