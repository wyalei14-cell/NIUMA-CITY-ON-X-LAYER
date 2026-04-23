#!/bin/bash
# Niuma City Reference Node Startup Script

set -e

cd /workspace/projects/workspace/niuma-city

export PORT=8787
export XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech/terigon
export SERVICE_AUTH_TOKEN=dev-service-token
export USE_SEED_EVENTS=true
export GITHUB_REPO=wyalei14-cell/NIUMA-CITY-ON-X-LAYER
export CONSTITUTION_HASH=sha256:dev-constitution

pkill -f "tsx watch" 2>/dev/null || true
sleep 2

if pgrep -f "tsx watch" > /dev/null; then
  echo "Warning: Old process still running, forcing kill"
  pkill -9 -f "tsx watch" 2>/dev/null || true
  sleep 1
fi

echo "Starting Niuma City Reference Node..."
npm run dev:node > /tmp/node.log 2>&1 &
NODE_PID=$!

echo "Waiting for node to start..."
for i in {1..30}; do
  if curl -s http://localhost:8787/api/citizens > /dev/null 2>&1; then
    echo "✅ Node started successfully (PID: $NODE_PID)"
    exit 0
  fi
  sleep 1
done

echo "❌ Node failed to start within 30 seconds"
exit 1
