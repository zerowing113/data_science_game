import { chromium, expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

test('offline save survives a complete launcher and browser process restart', async ({}, testInfo) => {
  const executable = process.env.LAUNCHER_PATH || path.resolve('.cache/launcher-test/Start Game.exe');
  const previousExecutable = process.env.PREVIOUS_LAUNCHER_PATH;
  const origin = 'http://127.0.0.1:43191';
  const profile = testInfo.outputPath('browser-profile');
  const versions: string[] = [];
  let child: ChildProcess | undefined;
  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
  async function launch(executablePath = executable) {
    child = spawn(executablePath, ['--headless', '--port', '43191'], { windowsHide: true, stdio: 'pipe' });
    let failure: Error | undefined;
    child.on('error', (error) => { failure = error; });
    await expect.poll(async () => {
      if (failure) throw failure;
      if (child?.exitCode !== null) throw new Error('Launcher exited before becoming ready');
      try { return (await fetch(`${origin}/__launcher/status`)).ok; } catch { return false; }
    }).toBe(true);
    versions.push((await (await fetch(`${origin}/__launcher/status`)).json()).version);
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
    const first = await launch(previousExecutable ?? executable);
    await first.getByRole('radio', { name: /Trend \+ promotions/ }).check();
    await first.getByLabel('Your prediction').fill('Stored across two offline processes');
    const code = await first.getByLabel('Python code', { exact: true }).inputValue();
    const run = first.getByRole('button', { name: 'Run forecast', exact: true });
    await expect(run).toBeEnabled({ timeout: 125_000 });
    await run.click();
    await expect(first.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0');
    await first.getByRole('button', { name: 'Plan stock from forecast run 1' }).click();
    await first.getByRole('button', { name: /Advance shop/ }).click();
    await first.getByRole('button', { name: 'Open final challenge', exact: true }).click();
    await first.getByLabel('Final expectation').fill('Promotions explain the new sale week.');
    await first.getByLabel('Final features').selectOption('promotions');
    await first.getByLabel('Final Python', { exact: true }).fill(`import pandas as pd
from sklearn.linear_model import LinearRegression
features = ["day", "promotion"]
model = LinearRegression()
model.fit(history[features], history["demand"])
predictions = pd.Series(model.predict(future[features]), index=future.index)`);
    const finalRun = first.getByRole('button', { name: 'Run final forecast', exact: true });
    await expect(finalRun).toBeEnabled({ timeout: 125_000 });
    await finalRun.click();
    await first.getByRole('button', { name: 'Commit stock and submit challenge' }).click();
    await first.getByLabel('Feature reasoning').fill('Planned promotions are known before the sale.');
    await first.getByLabel('Evaluation reasoning').fill('The model and baseline share the same later dates.');
    await first.getByLabel('Stocking reasoning').fill('I stocked from this forecast to balance lost sales and leftovers.');
    await first.getByRole('button', { name: 'Complete mission', exact: true }).click();
    await expect(first.getByRole('heading', { name: 'Mission complete: challenge 1' })).toBeVisible();
    await stop(first);
    const reopened = await launch();
    if (previousExecutable) {
      expect(path.resolve(previousExecutable)).not.toBe(path.resolve(executable));
      expect(versions[1]).not.toBe(versions[0]);
    }
    const recap = reopened.getByRole('article', { name: 'Challenge 1 results', exact: true });
    await expect(recap.getByRole('heading', { name: 'Mission complete: challenge 1' })).toBeVisible();
    await expect(recap).toContainText('Model MAE: 0.00');
    await expect(recap).toContainText('Planned promotions are known before the sale.');
    await expect(recap).toContainText('The model and baseline share the same later dates.');
    await expect(recap).toContainText('I stocked from this forecast to balance lost sales and leftovers.');
    await expect(reopened.getByRole('button', { name: 'Commit stock and submit challenge' })).toBeDisabled();
    await expect(reopened.getByRole('button', { name: 'Run final forecast', exact: true })).toBeDisabled();
    await reopened.getByRole('button', { name: 'Back to practice' }).click();
    await expect(reopened.getByLabel('Your prediction')).toHaveValue('Stored across two offline processes');
    await expect(reopened.getByLabel('Python code', { exact: true })).toHaveValue(code);
    await expect(reopened.getByRole('radio', { name: /Trend \+ promotions/ })).toBeChecked();
    await expect(reopened.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0', { timeout: 125_000 });
    await expect(reopened.getByRole('article', { name: 'Stocking decision 1' })).toContainText('Stored across two offline processes');
    await stop(reopened);
  } finally {
    await context?.close();
    child?.kill();
  }
});
