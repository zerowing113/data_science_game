"""Package a prepared production build. Python and Go are build tools only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {'windows-x64': ('windows', 'amd64'), 'macos-intel': ('darwin', 'amd64'), 'macos-apple-silicon': ('darwin', 'arm64')}

def sha(path):
    return hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', choices=TARGETS, action='append')
    parser.add_argument('--go', default='go')
    args = parser.parse_args()
    go = str(Path(args.go).resolve()) if Path(args.go).exists() else args.go
    version = json.loads((ROOT / 'package.json').read_text())['version']
    revision = subprocess.check_output(['git', 'rev-parse', '--short=12', 'HEAD'], cwd=ROOT, text=True).strip()
    dirty = bool(subprocess.check_output(['git', 'diff', 'HEAD', '--name-only'], cwd=ROOT, text=True).strip())
    build = f'{version}+{revision}' + ('.working' if dirty else '')
    go_version = subprocess.check_output([go, 'version'], text=True).strip()
    if 'go1.27.1 ' not in go_version:
        raise SystemExit('Use the pinned Go 1.27.1 toolchain for release builds.')
    dist = ROOT / 'dist'
    if not (dist / 'index.html').is_file():
        raise SystemExit('Run npm run prepare:python and npm run build before packaging.')
    lock = json.loads((dist / 'python/pyodide-lock.json').read_text())
    included = set()
    def verify(name):
        if name in included:
            return
        included.add(name)
        package = lock['packages'][name]
        file = dist / 'python' / package['file_name']
        if not file.is_file() or sha(file) != package['sha256']:
            raise SystemExit(f'Missing or corrupted Python dependency: {name}. Run npm run prepare:python and rebuild.')
        for dependency in package['depends']:
            verify(dependency)
    for name in ['pandas', 'scikit-learn']:
        verify(name)
    # Compare core assets to the installed pinned runtime, not just their existence.
    for name in ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']:
        if sha(dist / 'python' / name) != sha(ROOT / 'node_modules/pyodide' / name):
            raise SystemExit(f'Runtime mismatch: {name}. Prepare Python and rebuild.')
    output = ROOT / 'release'
    output.mkdir(exist_ok=True)
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    for target in args.target or TARGETS:
        goos, goarch = TARGETS[target]
        with tempfile.TemporaryDirectory(prefix='offline-', dir=cache) as temporary:
            staging = Path(temporary)
            source = staging / 'source'
            source.mkdir()
            for item in (ROOT / 'launcher').iterdir():
                if item.is_file():
                    shutil.copy2(item, source / item.name)
            shutil.copytree(dist, source / 'web')
            bundle = staging / f'Little Goods-{target}'
            bundle.mkdir()
            if goos == 'darwin':
                contents = bundle / 'Start Game.app/Contents'
                executable = contents / 'MacOS/StartGame'
                executable.parent.mkdir(parents=True)
                (contents / 'Info.plist').write_bytes(plistlib.dumps({
                    'CFBundleExecutable': 'StartGame', 'CFBundleIdentifier': 'com.littlegoods.offline',
                    'CFBundleName': 'Little Goods', 'CFBundleDisplayName': 'Start Game',
                    'CFBundlePackageType': 'APPL', 'CFBundleShortVersionString': version,
                    'CFBundleVersion': version, 'LSMinimumSystemVersion': '14.0', 'LSUIElement': True,
                }))
            else:
                executable = bundle / 'Start Game.exe'
            flags = f'-s -w -X main.version={build}' + (' -H windowsgui' if goos == 'windows' else '')
            subprocess.run([go, 'build', '-trimpath', '-buildvcs=false', '-ldflags', flags, '-o', str(executable), '.'],
                           cwd=source, env={**os.environ, 'GOOS': goos, 'GOARCH': goarch, 'CGO_ENABLED': '0'}, check=True)
            executable.chmod(0o755)
            shutil.copy2(ROOT / 'docs/offline-player-guide.md', bundle / 'READ ME.md')
            notices = bundle / 'THIRD-PARTY'
            notices.mkdir()
            for package in ['react', 'react-dom', 'scheduler']:
                shutil.copy2(ROOT / f'node_modules/{package}/LICENSE', notices / f'{package}-LICENSE.txt')
            goroot = Path(subprocess.check_output([go, 'env', 'GOROOT'], text=True).strip())
            shutil.copy2(goroot / 'LICENSE', notices / 'Go-LICENSE.txt')
            for item in (ROOT / 'licenses').iterdir():
                if item.is_file():
                    shutil.copy2(item, notices / item.name)
            # Preserve upstream license notices shipped inside Python wheels/zips.
            for archive in (dist / 'python').glob('*'):
                if archive.suffix not in ['.whl', '.zip']:
                    continue
                with zipfile.ZipFile(archive) as upstream:
                    for index, name in enumerate(upstream.namelist()):
                        if not name.endswith('/') and any(term in Path(name).name.lower() for term in ['license', 'copying', 'copyright', 'notice']):
                            (notices / f'{archive.stem}-{index}-{Path(name).name}').write_bytes(upstream.read(name))
            manifest = {'version': version, 'revision': revision, 'workingTree': dirty, 'target': target, 'go': go_version,
                        'pythonRuntime': json.loads((ROOT / 'node_modules/pyodide/package.json').read_text())['version'],
                        'packages': {name: lock['packages'][name]['version'] for name in sorted(included)},
                        'files': {str(file.relative_to(bundle)).replace('\\', '/'): sha(file) for file in sorted(bundle.rglob('*')) if file.is_file()}}
            (bundle / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
            archive = output / f'little-goods-{version}-{target}.zip'
            with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
                for file in sorted(bundle.rglob('*')):
                    if not file.is_file():
                        continue
                    info = zipfile.ZipInfo(str(file.relative_to(staging)).replace('\\', '/'), date_time=(2020, 1, 1, 0, 0, 0))
                    info.create_system = 3
                    info.external_attr = (0o100755 if file == executable else 0o100644) << 16
                    info.compress_type = zipfile.ZIP_DEFLATED
                    zipped.writestr(info, file.read_bytes())
            archive.with_suffix('.zip.sha256').write_text(f'{sha(archive)}  {archive.name}\n', encoding='ascii')
            print(archive, flush=True)

if __name__ == '__main__':
    main()
