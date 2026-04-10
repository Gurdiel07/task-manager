#!/bin/bash
set -e

echo ""
echo "Building Task Manager..."
npm run build

echo ""
# Read the URL from .env
URL=$(grep '^NEXTAUTH_URL=' .env | cut -d'=' -f2 | tr -d '"')

echo "==================================="
echo "  Task Manager is running!"
echo "  Open: $URL"
echo "  Press Ctrl+C to stop."
echo "==================================="
echo ""

npm run start
