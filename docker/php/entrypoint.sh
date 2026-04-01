#!/bin/sh
set -eu

cd /var/www/html/backend

wait_for_host() {
  host="$1"
  port="$2"
  name="$3"

  until php -r '$host = $argv[1]; $port = (int) $argv[2]; $socket = @fsockopen($host, $port, $errno, $errstr, 2); if ($socket) { fclose($socket); exit(0); } exit(1);' "$host" "$port"; do
    echo "Waiting for ${name} at ${host}:${port}..."
    sleep 2
  done
}

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
  composer install --no-interaction --prefer-dist
fi

if [ "${APP_SKIP_BOOTSTRAP:-false}" = "true" ]; then
  exec "$@"
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force
fi

if [ "${APP_WAIT_FOR_DB:-true}" = "true" ]; then
  wait_for_host "${DB_HOST:-postgres}" "${DB_PORT:-5432}" "database"
fi

if [ "${APP_WAIT_FOR_REDIS:-false}" = "true" ]; then
  wait_for_host "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "redis"
fi

if [ "${APP_RUN_MIGRATIONS:-true}" = "true" ]; then
  until php artisan migrate --force; do
    echo "Retrying migrations..."
    sleep 2
  done
fi

if [ "${APP_SEED_DEMO:-true}" = "true" ]; then
  php artisan db:seed --force
fi

exec "$@"
