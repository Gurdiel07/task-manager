.PHONY: dev test test-watch test-coverage lint typecheck build docker-up docker-down seed db-push db-studio reset

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
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d
	sleep 3
	npx prisma db push
	npx prisma db seed
