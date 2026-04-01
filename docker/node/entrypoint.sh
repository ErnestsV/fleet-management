#!/bin/sh
set -eu

cd /app/frontend

if [ ! -x node_modules/.bin/vite ]; then
  npm install
fi

exec "$@"
