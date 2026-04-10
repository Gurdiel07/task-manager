#!/bin/bash
set -e

PIDFILE=".taskmanager.pid"
LOGFILE="taskmanager.log"

if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
    echo "Task Manager is already running (PID: $(cat $PIDFILE))"
    exit 0
fi

echo ""
echo "Building Task Manager..."
npm run build

echo ""
echo "Starting Task Manager in background..."
nohup npm run start > "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"

URL=$(grep '^NEXTAUTH_URL=' .env | cut -d'=' -f2 | tr -d '"')

echo ""
echo "==================================="
echo "  Task Manager started!"
echo "  PID: $(cat $PIDFILE)"
echo "  URL: $URL"
echo "  Log: $LOGFILE"
echo "  Stop: ./scripts/stop.sh"
echo "==================================="
echo ""
