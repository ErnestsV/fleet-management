#!/bin/sh
set -eu

cd /var/www/html/backend

mkdir -p \
  storage/framework/cache \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY must be set for production runtime." >&2
  exit 1
fi

if [ "${APP_CACHE_CONFIG:-true}" = "true" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

exec "$@"
