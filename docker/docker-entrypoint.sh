#!/bin/sh
set -e

echo "Running Prisma schema sync..."
npx prisma db push --accept-data-loss

if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting server..."
exec node server.js
