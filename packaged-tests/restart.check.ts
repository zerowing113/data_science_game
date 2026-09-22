import { chromium, expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

test('offline save survives a complete launcher and browser process restart', async ({}, testInfo) => {
  const executable = process.env.LAUNCHER_PATH || path.resolve('.cache/launcher-test/Start Game.exe');
  const origin = 'http://127.0.0.1:43191';
  const profile = testInfo.outputPath('browser-profile');
  let child: ChildProcess | undefined;
  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
  async function launch() {
    child = spawn(executable, ['--headless', '--port', '43191'], { windowsHide: true, stdio: 'pipe' });
    let failure: Error | undefined;
    child.on('error', (error) => { failure = error; });
    await expect.poll(async () => {
      if (failure) throw failure;
      if (child?.exitCode !== null) throw new Error('Launcher exited before becoming ready');
      try { return (await fetch(`${origin}/__launcher/status`)).ok; } catch { return false; }
    }).toBe(true);
    context = await chromium.launchPersistentContext(profile, {
      headless: true, viewport: { width: 1440, height: 1000 },
      proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1' },
    });
    const page = context.pages()[0];
    await page.goto(origin);
    return page;
  }
  async function stop(page: Awaited<ReturnType<typeof launch>>) {
    const exited = once(child!, 'exit');
    await page.getByRole('button', { name: 'Stop game', exact: true }).click();
    await page.getByRole('button', { name: 'Stop and close session' }).click();
    await expect(page.getByRole('heading', { name: 'Game stopped. You can close this tab.' })).toBeVisible();
    await exited;
    await context!.close();
    context = undefined;
  }
  try {
    const first = await launch();
    await first.getByRole('radio', { name: /Trend \+ promotions/ }).check();
    await first.getByLabel('Your prediction').fill('Stored across two offline processes');
    const code = await first.getByLabel('Python code', { exact: true }).inputValue();
    const run = first.getByRole('button', { name: 'Run forecast', exact: true });
    await expect(run).toBeEnabled({ timeout: 125_000 });
    await run.click();
    await expect(first.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0');
    await stop(first);
    const reopened = await launch();
    await expect(reopened.getByLabel('Your prediction')).toHaveValue('Stored across two offline processes');
    await expect(reopened.getByLabel('Python code', { exact: true })).toHaveValue(code);
    await expect(reopened.getByRole('radio', { name: /Trend \+ promotions/ })).toBeChecked();
    await expect(reopened.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0', { timeout: 125_000 });
    await stop(reopened);
  } finally {
    await context?.close();
    child?.kill();
  }
});
