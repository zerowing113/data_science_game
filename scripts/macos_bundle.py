"""Seal a complete Mac app bundle for an unsigned test build.

Ad-hoc signing provides bundle integrity, not Developer ID or Gatekeeper trust.
"""
from pathlib import Path
import subprocess
import sys


def seal_bundle(app: Path):
    if sys.platform != 'darwin':
        raise RuntimeError('Mac bundles must be packaged on macOS so codesign can seal the complete app.')
    subprocess.run(['codesign', '--force', '--sign', '-', str(app)], check=True)
    subprocess.run(['codesign', '--verify', '--deep', '--strict', '--verbose=4', str(app)], check=True)


if __name__ == '__main__':
    seal_bundle(Path(sys.argv[1]))
