#!/bin/sh
set -eu

# Default to the BE compose service name on the shared docker network.
BACKEND_URL="${BACKEND_URL:-http://api:4000}"
export BACKEND_URL

echo "[fe] proxying /api -> ${BACKEND_URL}"

# Render nginx config with the runtime BACKEND_URL value.
envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
