#!/bin/bash
set -e

echo "==> Running database migrations..."
bundle exec rails db:prepare

echo "==> Backfilling payment allocations..."
bundle exec rails allocations:backfill 2>/dev/null || true

echo "==> Starting Rails server..."
bundle exec rails server -b 0.0.0.0 -p ${PORT:-3000}
