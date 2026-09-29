#!/bin/bash
# Start the local AXXES pair: Handshake (identity) on 3101, Vitrine (desk) on 3000.
#
# Both must be up together: Vitrine bounces unauthenticated visitors to
# Handshake to sign in, and the two verify the same session cookie because they
# share BETTER_AUTH_SECRET. Run Vitrine alone and /admin dead-ends.
#
# launchd has no shell profile, so nvm's node is named explicitly — PATH is not
# inherited and `npx` is otherwise not on it.
set -u

export PATH="/Users/admin/.nvm/versions/node/v20.20.2/bin:/usr/bin:/bin:/usr/sbin:/sbin"

DEV_DIR="/Users/admin/Developer"
LOGS="/tmp/axxes-local"
mkdir -p "$LOGS"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found on PATH — cannot start." >&2
  exit 1
fi

wait_for_port() {
  local port="$1" name="$2" tries=0
  while [ $tries -lt 90 ]; do
    if nc -z 127.0.0.1 "$port" 2>/dev/null; then
      echo "  $name is up on $port"
      return 0
    fi
    tries=$((tries + 1))
    sleep 1
  done
  echo "  $name did NOT come up on $port — see $LOGS/$name.log" >&2
  return 1
}

# Already-running instance: leave it alone. This script is the launchd job, so
# it gets re-invoked on every KeepAlive respawn and must not fight itself.
if nc -z 127.0.0.1 3000 2>/dev/null && nc -z 127.0.0.1 3101 2>/dev/null; then
  echo "  Vitrine and Handshake are already running; nothing to do."
  exit 0
fi

echo "Starting Handshake on 3101..."
( cd "$DEV_DIR/handshake.axxes.club" \
  && nohup npx next dev -p 3101 > "$LOGS/handshake.log" 2>&1 < /dev/null & disown ) || exit 1
wait_for_port 3101 Handshake

# Vitrine runs the production build rather than `next dev`.
#
# `next dev` hangs indefinitely compiling /admin on this machine — it reports
# "Compiling /admin ..." and never finishes, with no error. The page itself is
# fine: the same route answers correctly in under a second from `next start`.
# The dev server is kept for the landing page, where hot reload is genuinely
# useful, but the desk is the page that matters and it has to respond.
if [ ! -d "$DEV_DIR/vitrine/.next" ]; then
  echo "  building Vitrine once (first run only)..."
  ( cd "$DEV_DIR/vitrine" && npx next build > "$LOGS/vitrine-build.log" 2>&1 ) || {
    echo "  build failed — see $LOGS/vitrine-build.log" >&2; exit 1;
  }
fi

echo "Starting Vitrine on 3000 (production build)..."
( cd "$DEV_DIR/vitrine" \
  && nohup npx next start -p 3000 > "$LOGS/vitrine.log" 2>&1 < /dev/null & disown ) || exit 1
wait_for_port 3000 Vitrine

echo
echo "  Vitrine      http://localhost:3000"
echo "  The Desk     http://localhost:3000/admin"
echo "  Handshake    http://localhost:3101"
echo
echo "  Landing page and pricing work without signing in."
echo "  The Desk needs an AXXES account with a seat in a collection."
echo "  Logs: $LOGS/handshake.log  $LOGS/vitrine.log"
