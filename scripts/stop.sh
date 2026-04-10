#!/bin/bash

PIDFILE=".taskmanager.pid"

if [ ! -f "$PIDFILE" ]; then
    echo "Task Manager is not running (no PID file found)."
    exit 0
fi

PID=$(cat "$PIDFILE")

if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping Task Manager (PID: $PID)..."
    kill "$PID"
    rm -f "$PIDFILE"
    echo "Stopped."
else
    echo "Task Manager is not running (stale PID file)."
    rm -f "$PIDFILE"
fi
