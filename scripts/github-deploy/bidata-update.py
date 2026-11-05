#!/usr/bin/python3
"""Root-owned installer: accepts only the current main SHA from the fixed public repo.
Never executes repository code as root. Updates a fixed allowlist; preserves .env/data.
"""
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request
from pathlib import Path, PurePosixPath
import fcntl

REPO = 'ismailovs/bidata-web-app'
APP = Path('/opt/bidata-web-app')
STATE = Path('/var/lib/bidata-deploy')
MAX_ARCHIVE = 20 * 1024 * 1024

def allowed(name):
    path = PurePosixPath(name)
    return (not path.is_absolute() and '..' not in path.parts and
            (name in ('server.mjs', 'package.json', 'data/sample-tenders.json') or
             (name.startswith('public/') and len(path.parts) > 1)))

def fetch(url, limit=MAX_ARCHIVE):
    req = urllib.request.Request(url, headers={'User-Agent': 'Bidata-Deploy', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(req, timeout=45) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Download exceeds size limit')
    return data

def unpack(data):
    files = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        total = 0
        for member in archive.getmembers():
            parts = member.name.split('/', 1)
            if len(parts) != 2:
                continue
            name = parts[1]
            if not allowed(name):
                continue
            if member.isdir():
                continue
            if not member.isfile() or member.issym() or member.islnk():
                raise ValueError('Links/special files prohibited: ' + name)
            total += member.size
            if total > MAX_ARCHIVE or name in files:
                raise ValueError('Archive too large or duplicate entry')
            files[name] = archive.extractfile(member).read()
    if not {'server.mjs', 'package.json', 'public/index.html', 'data/sample-tenders.json'} <= files.keys():
        raise ValueError('Required app files missing')
    return files

def inventory():
    files = {}
    for base in (APP / 'public', APP / 'data'):
        if base.exists():
            for path in base.rglob('*'):
                name = path.relative_to(APP).as_posix()
                if allowed(name):
                    if path.is_symlink():
                        raise ValueError('Existing app has a symlink')
                    if path.is_file():
                        files[name] = path.read_bytes()
    for name in ('server.mjs', 'package.json'):
        path = APP / name
        if path.is_symlink():
            raise ValueError('Existing app has a symlink')
        files[name] = path.read_bytes()
    return files

def install(files, remove_names):
    for name in sorted(remove_names - files.keys()):
        (APP / name).unlink(missing_ok=True)
    for name, data in files.items():
        path = APP / name
        # Parent components must not redirect root writes outside the app.
        parent = path.parent
        while parent != APP:
            if parent.is_symlink():
                raise ValueError('Symlink parent prohibited')
            parent = parent.parent
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
        fd, tmp = tempfile.mkstemp(prefix='.deploy-', dir=path.parent)
        try:
            with os.fdopen(fd, 'wb') as out:
                out.write(data)
            os.chmod(tmp, 0o644)
            os.replace(tmp, path)
        finally:
            Path(tmp).unlink(missing_ok=True)

def service(action):
    subprocess.run(['/usr/bin/systemctl', action, 'bidata-web.service'], check=True, timeout=30)

def healthy():
    for _ in range(20):
        try:
            data = json.loads(fetch('http://127.0.0.1:8187/api/config', 8192))
            if data.get('dataMode') in ('sample', 'live') and isinstance(data.get('paymentsEnabled'), bool):
                return True
        except Exception:
            pass
        time.sleep(1)
    return False

def main():
    if os.geteuid() != 0 or len(sys.argv) != 2 or not re.fullmatch('[0-9a-f]{40}', sys.argv[1]):
        raise ValueError('Requires root and one full lowercase commit SHA')
    sha = sys.argv[1]
    STATE.mkdir(mode=0o700, exist_ok=True)
    with (STATE / 'deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        approved = json.loads(fetch('https://api.github.com/repos/' + REPO + '/git/ref/heads/main', 65536))['object']['sha']
        if sha != approved:
            raise ValueError('Only the current main branch commit can be deployed')
        if APP.is_symlink() or not (APP / '.env').is_file():
            raise ValueError('Existing installation required; app path cannot be a symlink')
        files = unpack(fetch('https://codeload.github.com/' + REPO + '/tar.gz/' + sha))
        old = inventory()
        backup = STATE / 'backups' / (time.strftime('%Y%m%d-%H%M%S') + '-' + sha[:8])
        backup.mkdir(parents=True, mode=0o700)
        for name, data in old.items():
            dest = backup / name
            dest.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            dest.write_bytes(data)
        try:
            service('stop')
            install(files, old.keys())
            service('start')
            if not healthy():
                raise RuntimeError('New version failed health check')
        except BaseException:
            # Stop before restoring so no process serves a mixed release.
            service('stop')
            install(old, files.keys())
            service('start')
            print('Previous application code restored. Database and .env preserved.', file=sys.stderr)
            raise
        (STATE / 'current-sha').write_text(sha + '\n')
        print('Deployed ' + sha + '; health check passed. Backup: ' + str(backup))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Deployment stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
