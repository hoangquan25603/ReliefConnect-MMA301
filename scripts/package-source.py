"""Create a reproducible source handoff without caches, local data or secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os

root = Path(__file__).resolve().parents[1]
target = root / 'artifacts' / 'ReliefConnect-MMA301-source.zip'
target.parent.mkdir(exist_ok=True)
folders = ['MOBILE', 'FRONTEND', 'DisasterReliefSystem', 'marketing', 'docs', 'scripts']
skip_dirs = {'.git', '.vs', '.idea', '.gradle', '.kotlin', '.cxx', '.expo', 'node_modules', 'bin', 'obj', 'build', 'dist', '.local', '.tools', 'TestResults', 'test-results', 'playwright-report'}
skip_suffixes = {'.db', '.db-shm', '.db-wal', '.eml', '.log', '.pfx', '.jks'}
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for name in ['README.md', 'MMA301-SCOPE.md', 'START-DEMO.ps1', 'START-DEMO.cmd', '.gitignore']:
        file = root / name
        if file.exists(): archive.write(file, file.relative_to(root))
    for folder in folders:
        for base, dirs, files in os.walk(root / folder):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for name in files:
                file = Path(base) / name
                if name == 'local.properties' or (name.startswith('.env') and name != '.env.example') or file.suffix in skip_suffixes:
                    continue
                if file.suffix == '.keystore' and name != 'debug.keystore': continue
                if file.is_symlink(): continue
                archive.write(file, file.relative_to(root))
print(target)
print(f'{target.stat().st_size / 1024 / 1024:.2f} MiB')
