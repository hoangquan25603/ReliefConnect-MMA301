"""Package the ready-to-run demo and marketing, excluding machine-local state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import os
import json

root=Path(__file__).resolve().parents[1]
artifacts=root/'artifacts'
def zip_tree(source,target):
    with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as archive:
        for base,dirs,files in os.walk(source):
            dirs[:]=[d for d in dirs if d not in {'.local','.git','node_modules'}]
            for name in files:
                file=Path(base)/name
                if file.suffix in {'.db','.eml','.log'}: continue
                archive.write(file,file.relative_to(source))
    with ZipFile(target) as archive:
        assert archive.testzip() is None
    print(f'{target.name}: {target.stat().st_size/1024/1024:.2f} MiB')
zip_tree(artifacts/'server-win-x64',artifacts/'ReliefConnect-server-win-x64.zip')
zip_tree(root/'marketing',artifacts/'ReliefConnect-marketing.zip')
names=['ReliefConnect-MMA301-arm64.apk','ReliefConnect-MMA301-source.zip','ReliefConnect-server-win-x64.zip','ReliefConnect-marketing.zip']
entries=[]
for name in names:
    file=artifacts/name
    if not file.exists(): raise FileNotFoundError(name)
    entries.append({'file':name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
(artifacts/'SHA256SUMS.txt').write_text(''.join(e['sha256']+'  '+e['file']+'\n' for e in entries),encoding='utf-8')
(artifacts/'manifest.json').write_text(json.dumps({'date':'2026-10-29','files':entries},indent=2),encoding='utf-8')
print('Verified all archives and wrote SHA256SUMS.txt')
