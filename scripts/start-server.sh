#!/bin/bash

# Start Server Script
# This script prepares and starts the Lovable Automation server

set -e

echo "🚀 Starting Lovable Automation Server..."

# Check if required environment variables are set
required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "MERCADO_PAGO_ACCESS_TOKEN"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '  - %s\n' "${missing_vars[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"

# Run database migrations
echo "📦 Running database migrations..."
pnpm db:push

# Start the server
echo "🌍 Starting server on port 3000..."
node dist/index.js
