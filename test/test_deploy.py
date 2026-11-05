import importlib.util
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bidata_update', Path(__file__).resolve().parents[1] / 'scripts/github-deploy/bidata-update.py')
update = importlib.util.module_from_spec(spec)
spec.loader.exec_module(update)

VALID = {'server.mjs': b'new server', 'package.json': b'{}', 'public/index.html': b'<html>new</html>', 'data/sample-tenders.json': b'[]'}

def archive(files, link=None):
    out = io.BytesIO()
    with tarfile.open(fileobj=out, mode='w:gz') as tar:
        for name, data in files.items():
            info = tarfile.TarInfo('repository-sha/' + name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
        if link:
            info = tarfile.TarInfo('repository-sha/' + link)
            info.type = tarfile.SYMTYPE
            info.linkname = '/etc/shadow'
            tar.addfile(info)
    return out.getvalue()

class DeployTests(unittest.TestCase):
    def test_allowlist_keeps_settings_and_database_out(self):
        files = update.unpack(archive({**VALID, '.env': b'secret', 'data/tenders.json': b'private', 'scripts/root.sh': b'bad'}))
        self.assertEqual(files, VALID)
        for name in ('../.env', 'public/../../.env', '/public/file', '.env', 'data/bidata.sqlite'):
            self.assertFalse(update.allowed(name))

    def test_symlink_and_incomplete_archive_rejected(self):
        with self.assertRaises(ValueError):
            update.unpack(archive(VALID, link='public/leak'))
        with self.assertRaises(ValueError):
            update.unpack(archive({'server.mjs': b'only one file'}))

    def test_install_preserves_runtime_files_and_removes_stale_public_assets(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(update, 'APP', Path(temp)):
            app = Path(temp)
            (app/'data').mkdir()
            (app/'public').mkdir()
            (app/'.env').write_text('secret unchanged')
            (app/'data/tenders.json').write_text('live unchanged')
            (app/'public/old.js').write_text('old asset')
            update.install(VALID, {'public/old.js'})
            self.assertEqual((app/'.env').read_text(), 'secret unchanged')
            self.assertEqual((app/'data/tenders.json').read_text(), 'live unchanged')
            self.assertFalse((app/'public/old.js').exists())
            self.assertEqual((app/'server.mjs').read_bytes(), b'new server')

    def test_failed_health_restores_previous_code(self):
        sha = 'a' * 40
        with tempfile.TemporaryDirectory() as temp:
            app = Path(temp)/'app'; app.mkdir()
            old = {**VALID, 'server.mjs': b'old server'}
            with patch.object(update, 'APP', app):
                update.install(old, set())
                (app/'.env').write_text('keep')
                def fetch(url, limit=None):
                    return json.dumps({'object': {'sha': sha}}).encode() if 'api.github.com' in url else archive(VALID)
                with patch.object(update, 'STATE', Path(temp)/'state'), patch.object(update, 'fetch', side_effect=fetch), patch.object(update.os, 'geteuid', return_value=0), patch.object(sys, 'argv', ['helper', sha]), patch.object(update, 'service') as service, patch.object(update, 'healthy', return_value=False):
                    with self.assertRaises(RuntimeError): update.main()
                    self.assertEqual([c.args[0] for c in service.call_args_list], ['stop','start','stop','start'])
                self.assertEqual((app/'server.mjs').read_bytes(), b'old server')
                self.assertEqual((app/'.env').read_text(), 'keep')

    def test_unapproved_commit_stops_before_service_change(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(update, 'STATE', Path(temp)), patch.object(update.os, 'geteuid', return_value=0), patch.object(sys, 'argv', ['helper', 'a'*40]), patch.object(update, 'fetch', return_value=json.dumps({'object': {'sha': 'b'*40}}).encode()), patch.object(update, 'service') as service:
            with self.assertRaises(ValueError): update.main()
            service.assert_not_called()

if __name__ == '__main__':
    unittest.main()
