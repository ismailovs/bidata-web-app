#!/usr/bin/env bash
# Run from a reviewed Git checkout on the destination server. No credentials in this script.
set -euo pipefail
APP_DIR=/opt/bidata-web-app
DATA_DIR=/var/lib/bidata
SERVICE=bidata-web
PORT=8187
DOMAIN=${1:-app.bidata.uz}
[[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]] || { echo 'Invalid hostname'; exit 1; }
for executable in node git curl systemctl ss getent useradd install tar; do
  command -v "$executable" >/dev/null || { echo "Missing prerequisite: $executable"; exit 1; }
done
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 24 ]] || { echo 'Install Node 24 LTS first; existing Node versions are not replaced.'; exit 1; }
NODE_BIN=$(command -v node)
case "$NODE_BIN" in /root/*|/home/*) echo 'Node must be system-installed outside a home directory.'; exit 1;; esac
REPO=$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)
[[ -z "$(git -C "$REPO" status --porcelain)" ]] || { echo 'Use a clean reviewed Git checkout.'; exit 1; }
if ss -H -ltn "sport = :$PORT" | head -c 1 | read -r -n 1; then echo "Port $PORT already in use; inspect it before proceeding."; exit 1; fi
for path in "$APP_DIR" "$DATA_DIR" "/etc/systemd/system/$SERVICE.service"; do
 [[ ! -e "$path" ]] || { echo "Already exists: $path. Stopping to avoid overwriting an installation."; exit 1; }
done
if [[ ${2:-} == --check ]]; then echo "Preflight passed: $DOMAIN, port $PORT, $(git -C "$REPO" rev-parse --short HEAD). No files changed."; exit 0; fi
[[ $EUID -eq 0 ]] || { echo 'Run as root (sudo) on the destination server.'; exit 1; }
getent passwd bidata >/dev/null || useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin bidata
install -d -m 755 "$APP_DIR"
install -d -m 700 -o bidata -g bidata "$DATA_DIR"
git -C "$REPO" archive HEAD | tar -x -C "$APP_DIR"
# Application code stays root-owned and read-only to the service account.
chmod -R go-w "$APP_DIR"
umask 077
cat > "$APP_DIR/.env" <<ENV
PUBLIC_ORIGIN=https://$DOMAIN
HOST=127.0.0.1
PORT=$PORT
DATABASE_PATH=$DATA_DIR/bidata.sqlite
DATA_MODE=sample
PAYMENTS_ENABLED=false
BILLING_MODE=off
ENV
chown bidata:bidata "$APP_DIR/.env"
cat > "/etc/systemd/system/$SERVICE.service" <<UNIT
[Unit]
Description=Bidata tender web application
After=network.target
[Service]
Type=simple
User=bidata
Group=bidata
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN --env-file=.env server.mjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now "$SERVICE"
for attempt in {1..15}; do
 if curl -fsS "http://127.0.0.1:$PORT/api/config" >/dev/null; then
  echo "Application healthy on 127.0.0.1:$PORT. Payments OFF; sample tenders."
  echo "Next: configure a separate HTTPS vhost for $DOMAIN. Existing Nginx/DNS untouched."
  exit 0
 fi
 sleep 1
done
echo "Health check failed. Inspect: journalctl -u $SERVICE -n 50 --no-pager"
exit 1
