"""Extract a package for native verification, preserving executable mode on Mac."""
import argparse
import json
from pathlib import Path
import zipfile
import hashlib

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive', type=Path)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
destination = args.destination.resolve()
with zipfile.ZipFile(args.archive) as archive:
    for item in archive.infolist():
        target = (destination / item.filename).resolve()
        if not target.is_relative_to(destination):
            raise SystemExit('Archive contains an unsafe path')
        archive.extract(item, destination)
        if target.is_file():
            target.chmod((item.external_attr >> 16) & 0o777)
for manifest_path in destination.glob('*/manifest.json'):
    manifest = json.loads(manifest_path.read_text())
    for name, expected in manifest['files'].items():
        file = (manifest_path.parent / name).resolve()
        if not file.is_relative_to(manifest_path.parent.resolve()):
            raise SystemExit('Manifest contains an unsafe path')
        with file.open('rb') as stream:
            if hashlib.file_digest(stream, 'sha256').hexdigest() != expected:
                raise SystemExit(f'Package checksum mismatch: {name}')
    executable = manifest_path.parent / ('Start Game.exe' if manifest['target'].startswith('windows') else 'Start Game.app/Contents/MacOS/StartGame')
    print(executable)
