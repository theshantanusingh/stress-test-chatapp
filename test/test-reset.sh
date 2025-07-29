#!/bin/bash
echo "Stopping old server..."
pkill -f server.js

echo "Archiving previous logs..."
mv logs/chat-logs.jsonl logs/chat-logs-$(date +%s).jsonl 2>/dev/null

echo "Starting fresh server..."
node server.js &
sleep 2