#!/usr/bin/python3
"""Forced SSH entry: no shell, uploads, forwarding, arbitrary sudo, or arbitrary refs."""
import os
import re
import subprocess
import sys
match = re.fullmatch(r'deploy ([0-9a-f]{40})', os.environ.get('SSH_ORIGINAL_COMMAND', ''))
if not match:
    print('Only deploy <full-commit-sha> is allowed.', file=sys.stderr)
    sys.exit(1)
sys.exit(subprocess.run(['/usr/bin/sudo', '-n', '/usr/local/sbin/bidata-update', match[1]], timeout=300).returncode)
