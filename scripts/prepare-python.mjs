import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = dirname(fileURLToPath(import.meta.resolve('pyodide')));
const destination = join(root, 'public', 'python');
const { version } = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(join(source, 'pyodide-lock.json'), 'utf8'));
await mkdir(destination, { recursive: true });
for (const file of ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  await copyFile(join(source, file), join(destination, file));
}

const packages = new Set();
function include(name) {
  if (packages.has(name)) return;
  if (!lock.packages[name]) throw new Error(`Package missing from Pyodide lock: ${name}`);
  packages.add(name);
  lock.packages[name].depends.forEach(include);
}
['pandas', 'scikit-learn'].forEach(include);
const checksum = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const name of packages) {
  const pkg = lock.packages[name];
  const target = join(destination, pkg.file_name);
  const cached = await readFile(target).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (cached && checksum(cached) === pkg.sha256) continue;
  const response = await fetch(`https://cdn.jsdelivr.net/pyodide/v${version}/full/${pkg.file_name}`, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Download failed for ${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (checksum(bytes) !== pkg.sha256) throw new Error(`Checksum mismatch for ${name}`);
  await writeFile(target, bytes);
  console.log(`Prepared ${name} ${pkg.version}`);
}
console.log(`Python ${version} ready: runtime and ${packages.size} verified packages in public/python.`);
