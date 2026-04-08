.PHONY: setup dev test test-watch test-coverage lint typecheck build docker-up docker-down seed db-push db-studio reset

setup:
	node scripts/setup.mjs

dev:
	npm run dev

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

build:
	npm run build

docker-up:
	docker compose -f docker/docker-compose.yml up -d

docker-down:
	docker compose -f docker/docker-compose.yml down

seed:
	npx prisma db seed

db-push:
	npx prisma db push

db-studio:
	npx prisma studio

reset:
	rm -f data/taskmanager.db
	npx prisma db push
	npx prisma db seed
