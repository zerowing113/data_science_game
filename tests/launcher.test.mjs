import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import http from 'node:http';

const executable = process.env.LAUNCHER_PATH || path.resolve('.cache/launcher-test/Start Game.exe');
const port = 43189;
const origin = `http://127.0.0.1:${port}`;
function launch() { return spawn(executable, ['--headless', '--port', String(port)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }); }
async function ready(child) {
  let failure;
  child.on('error', (error) => { failure = error; });
  for (let i = 0; i < 100; i++) {
    if (failure) throw failure;
    if (child.exitCode !== null) throw new Error(`Launcher exited ${child.exitCode}`);
    try { const response = await fetch(`${origin}/__launcher/status`); if (response.ok) return await response.json(); } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Launcher did not become ready');
}

test('a packaged launcher serves the game, reuses an existing launch and stops on request', async () => {
  const first = launch();
  try {
    const status = await ready(first);
    assert.equal(status.app, 'little-goods');
    assert.match(await (await fetch(origin)).text(), /<title>Little Goods/);
    assert.match((await fetch(`${origin}/python/pyodide.asm.wasm`)).headers.get('content-type'), /application\/wasm/);
    const second = launch();
    const [exit] = await once(second, 'exit');
    assert.equal(exit, 0);
    assert.equal((await ready(first)).token, status.token);
    const stopped = once(first, 'exit');
    const response = await fetch(`${origin}/__launcher/stop`, { method: 'POST', headers: { Origin: origin, 'X-Launcher-Token': status.token } });
    assert.equal(response.status, 200);
    assert.equal((await stopped)[0], 0);
  } finally { first.kill(); }
});

test('an occupied port gives a readable failure without opening an unrelated service', async () => {
  const unrelated = http.createServer((_req, res) => { res.end('Different application'); });
  unrelated.listen(port, '127.0.0.1');
  await once(unrelated, 'listening');
  try {
    const child = launch();
    let message = '';
    child.stderr.on('data', (chunk) => { message += chunk; });
    const [exit] = await once(child, 'exit');
    assert.equal(exit, 1);
    assert.match(message, /Another program may be using it/);
  } finally { await new Promise((resolve) => unrelated.close(resolve)); }
});

test('foreign origins, unsafe stop requests and directory browsing are rejected', async () => {
  const child = launch();
  try {
    const status = await ready(child);
    assert.equal((await fetch(`${origin}/__launcher/status`, { headers: { Origin: 'https://example.com' } })).status, 403);
    assert.equal((await fetch(`${origin}/__launcher/stop`)).status, 405);
    assert.equal((await fetch(`${origin}/__launcher/stop`, { method: 'POST', headers: { Origin: origin } })).status, 403);
    assert.equal((await fetch(`${origin}/python/`)).status, 404);
    assert.equal((await fetch(`${origin}/../go.mod`)).status, 404);
    assert.equal((await ready(child)).token, status.token);
    const stopped = once(child, 'exit');
    await fetch(`${origin}/__launcher/stop`, { method: 'POST', headers: { Origin: origin, 'X-Launcher-Token': status.token } });
    assert.equal((await stopped)[0], 0);
  } finally { child.kill(); }
});
