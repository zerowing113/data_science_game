import { spawn } from 'node:child_process';
import path from 'node:path';
const executable = process.env.LAUNCHER_PATH || path.resolve('.cache/launcher-test/Start Game.exe');
const child = spawn(executable, ['--headless', '--port', '43190'], { windowsHide: true, stdio: 'inherit' });
child.on('error', (error) => { console.error(error); process.exit(1); });
child.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill());
