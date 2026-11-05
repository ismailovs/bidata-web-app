#!/usr/bin/env bash
# One-time server setup, executed by the owner from a reviewed checkout.
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Run as root on Hetzner.'; exit 1; }
repo=$(cd "$(dirname "$0")/.." && pwd)
for command in python3 ssh-keygen visudo useradd getent systemctl install; do
 command -v "$command" >/dev/null || { echo "Missing prerequisite: $command"; exit 1; }
done
systemctl is-active --quiet bidata-web || { echo 'Bidata must already be running.'; exit 1; }
test -r /etc/ssh/ssh_host_ed25519_key.pub
for path in /usr/local/sbin/bidata-update /usr/local/bin/bidata-deploy-entry /etc/sudoers.d/bidata-deploy /var/lib/bidata-deployer /root/.ssh/bidata-actions; do
 [[ ! -e "$path" ]] || { echo "Already exists: $path. Stopping without replacing access."; exit 1; }
done
if getent passwd bidata-deploy >/dev/null; then echo 'Deployment user already exists; stopping.'; exit 1; fi
# Syntax validation does not run helper modules or repository application code.
python3 - "$repo" <<'PY'
import ast,sys
from pathlib import Path
for path in (Path(sys.argv[1])/'scripts/github-deploy').glob('*.py'):
 ast.parse(path.read_text())
PY
sudo_tmp=$(mktemp)
trap 'rm -f "$sudo_tmp"' EXIT
printf '%s\n' 'bidata-deploy ALL=(root) NOPASSWD: /usr/local/sbin/bidata-update *' > "$sudo_tmp"
visudo -cf "$sudo_tmp"
install -o root -g root -m 755 "$repo/scripts/github-deploy/bidata-update.py" /usr/local/sbin/bidata-update
install -o root -g root -m 755 "$repo/scripts/github-deploy/entry.py" /usr/local/bin/bidata-deploy-entry
install -d -m 755 -o root -g root /var/lib/bidata-deployer/.ssh
useradd --system --home-dir /var/lib/bidata-deployer --shell /bin/sh bidata-deploy
install -o root -g root -m 440 "$sudo_tmp" /etc/sudoers.d/bidata-deploy
install -d -m 700 /root/.ssh
ssh-keygen -q -t ed25519 -N '' -C 'bidata-github-actions' -f /root/.ssh/bidata-actions
{ printf 'restrict,command="/usr/local/bin/bidata-deploy-entry" '; cat /root/.ssh/bidata-actions.pub; } > /var/lib/bidata-deployer/.ssh/authorized_keys
chmod 644 /var/lib/bidata-deployer/.ssh/authorized_keys
chown root:root /var/lib/bidata-deployer/.ssh/authorized_keys
# Print PUBLIC host identity only. The private deployment key is never printed.
awk '{print "188.245.246.102 " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
printf '\nSetup complete. Private deployment key: /root/.ssh/bidata-actions\n'
printf 'Copy it ONLY into GitHub environment secret HETZNER_SSH_KEY. Do not paste it in chat.\n'
printf 'The public host-key line above goes into HETZNER_KNOWN_HOSTS.\n'
printf 'No application files, database, .env, Nginx or payment settings changed.\n'
