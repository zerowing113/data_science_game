import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.setTimeout(300_000);
test.use({ actionTimeout: 15_000 });
const key = 'little-goods-journey';
const finalSolution = `import pandas as pd
from sklearn.linear_model import LinearRegression
features = ["day", "promotion"]
model = LinearRegression()
model.fit(history[features], history["demand"])
predictions = pd.Series(model.predict(future[features]), index=future.index)`;

test('reload and reopening retain inspected practice, hints, editable code and original forecast evidence', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start guided practice', exact: true }).click();
  await page.getByRole('button', { name: '2026-09-04', exact: true }).click();
  await page.getByRole('button', { name: 'Explain demand', exact: true }).click();
  await page.getByRole('tab', { name: 'Upcoming week', exact: true }).click();
  await page.getByRole('button', { name: 'Show next hint' }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Practice mission' })).toContainText('Hints viewed: 1 of 3');
  await page.getByRole('button', { name: 'I inspected the history and future inputs' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  await page.getByLabel('Your prediction').fill('Original promotion forecast');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0');
  await page.getByRole('button', { name: 'I inspected forecast run 1', exact: true }).click();
  await page.getByLabel('Python code', { exact: true }).fill('raise ValueError("saved failure")');
  await page.getByLabel('Your prediction').fill('Failure source');
  await run.click();
  await expect(page.getByRole('alert')).toContainText('saved failure');
  await page.getByLabel('Python code', { exact: true }).fill('# draft for tomorrow');
  await page.getByLabel('Your prediction').fill('Tomorrow expectation');
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByLabel('Python code', { exact: true })).toHaveValue('# draft for tomorrow');
  await expect(reopened.getByLabel('Your prediction')).toHaveValue('Tomorrow expectation');
  await expect(reopened.getByRole('radio', { name: /Trend \+ promotions/ })).toBeChecked();
  await expect(reopened.getByRole('region', { name: 'Practice mission' })).toContainText('Forecast run 1');
  await expect(reopened.getByRole('alert')).toContainText('saved failure', { timeout: 125_000 });
  await reopened.getByText('Forecast experiment history (2 runs)', { exact: true }).click();
  await reopened.getByText('Run 2: failed or interrupted', { exact: true }).click();
  await expect(reopened.locator('details[open]').filter({ hasText: 'Original choice: promotions. Expected: Failure source' }).last()).toContainText('raise ValueError("saved failure")');
  await reopened.getByRole('button', { name: 'Return to free practice' }).click();
  await reopened.getByRole('button', { name: 'Plan stock from forecast run 1' }).click();
  await reopened.getByRole('button', { name: /Advance shop/ }).click();
  await reopened.reload();
  await expect(reopened.getByRole('article', { name: 'Stocking decision 1' })).toContainText('Original promotion forecast');
  await expect(reopened.getByRole('button', { name: /Advance shop/ })).toBeDisabled();
});

test('Start over requires confirmation and resets the whole journey across reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Keep this until I confirm');
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  await page.getByLabel('Final expectation').fill('Final draft');
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep my journey' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep my journey' }).click();
  await expect(page.getByRole('button', { name: 'Start over', exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByLabel('Final expectation')).toHaveValue('Final draft');
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Delete journey and start over' }).click();
  await expect(page.getByLabel('Your prediction')).toHaveValue('');
  await expect(page.getByRole('region', { name: 'Final challenge', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Your prediction')).toHaveValue('');
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  await expect(page.getByLabel('Final expectation')).toHaveValue('');
});

for (const [name, raw] of [
  ['malformed', '{broken save'],
  ['incompatible', '{"version":99,"values":{}}'],
  ['invalid progress', '{"version":1,"values":{"mission":{"active":true,"current":99,"evidence":{},"hints":{},"observed":{}}}}'],
  ['invalid forecast length', JSON.stringify({ version: 1, values: { 'forecast.previous': {
    number: 1, code: 'saved code', expectation: 'saved expectation', choice: 'trend', output: '', predictions: Array(14).fill(60),
  } } })],
]) test(`${name} save remains available as an exact backup until confirmed deletion`, async ({ page }) => {
  await page.goto('/');
  // Corrupted storage is an external input; assertions use the recovery UI and
  // downloaded backup, not implementation internals.
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('It has not been changed');
  await expect(page.getByLabel('Your prediction')).toHaveCount(0);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download journey backup' }).click();
  const backup = await downloaded;
  expect(await readFile((await backup.path())!, 'utf8')).toBe(raw);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('It has not been changed');
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Delete journey and start over' }).click();
  await expect(page.getByLabel('Your prediction')).toHaveValue('');
  await page.reload();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('storage failure preserves work and previous save; retry and failed deletion remain safe', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Last stored expectation');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
    Storage.prototype.removeItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  await page.getByLabel('Your prediction').fill('Unsaved expectation');
  await expect(page.getByRole('alert')).toContainText('Progress could not be saved');
  await expect(page.getByLabel('Your prediction')).toHaveValue('Unsaved expectation');
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Delete journey and start over' }).click();
  await expect(page.getByRole('alert')).toContainText('has not been reset');
  await expect(page.getByLabel('Your prediction')).toHaveValue('Unsaved expectation');
  await page.reload();
  await expect(page.getByLabel('Your prediction')).toHaveValue('Last stored expectation');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) {
      Storage.prototype.setItem = original;
      throw new DOMException('Temporary storage failure', 'QuotaExceededError');
    };
  });
  await page.getByLabel('Your prediction').fill('Retried expectation');
  await expect(page.getByRole('alert')).toContainText('Progress could not be saved');
  await page.getByRole('button', { name: 'Retry saving' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Your prediction')).toHaveValue('Retried expectation');
});

test('revealed results, reflection drafts and completed recaps survive reload; retries retain original attribution', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  await page.getByLabel('Final expectation').fill('The original final expectation');
  await page.getByLabel('Final features').selectOption('promotions');
  await page.getByLabel('Final Python', { exact: true }).fill(finalSolution);
  const run = page.getByRole('button', { name: 'Run final forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  const submit = page.getByRole('button', { name: 'Commit stock and submit challenge' });
  await expect(submit).toBeEnabled();
  await page.getByLabel('Final stock for 2026-10-26').fill('117');
  await page.reload();
  await expect(page.getByLabel('Final stock for 2026-10-26')).toHaveValue('117');
  await expect(submit).toBeEnabled({ timeout: 125_000 });
  await submit.click();
  await page.getByLabel('Feature reasoning').fill('Planned promotion is known before forecasting.');
  await page.reload();
  const recap = page.getByRole('article', { name: 'Challenge 1 results', exact: true });
  await expect(recap).toContainText('Model MAE: 0.00');
  await expect(recap).toContainText('Profit: $6,069.00');
  await expect(page.getByLabel('Feature reasoning')).toHaveValue('Planned promotion is known before forecasting.');
  await expect(run).toBeDisabled();
  await expect(submit).toBeDisabled();
  await page.getByLabel('Evaluation reasoning').fill('The shared later dates give model MAE zero versus baseline eight.');
  await page.getByLabel('Stocking reasoning').fill('One mug short loses one sale, with profit 6069.');
  await page.getByRole('button', { name: 'Complete mission', exact: true }).click();
  await page.reload();
  await expect(recap.getByRole('heading', { name: 'Mission complete: challenge 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Try a fresh challenge' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Challenge 2: the festival sale' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Final upcoming inputs' })).toContainText('2026-11-30');
  await expect(recap).toContainText('The original final expectation');
  await expect(recap).toContainText('profit 6069');
  await expect(page.getByLabel('Final expectation')).toHaveValue('');
  await expect(submit).toBeDisabled();
});

test('closing during Python execution retains interrupted source and requires a fresh retry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  await page.getByLabel('Final expectation').fill('Interrupted source expectation');
  await page.getByLabel('Final Python', { exact: true }).fill('while True:\n    pass');
  const run = page.getByRole('button', { name: 'Run final forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  await expect(page.getByRole('button', { name: 'Stop final run' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Run interrupted when the game closed', { timeout: 125_000 });
  await expect(page.getByLabel('Final Python', { exact: true })).toHaveValue('while True:\n    pass');
  await page.getByText('Final experiment history (1 runs)', { exact: true }).click();
  await page.getByText('Run 1: failed', { exact: true }).click();
  await expect(page.locator('details[open]').last()).toContainText('Interrupted source expectation');
  await expect(page.getByRole('button', { name: 'Commit stock and submit challenge' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset final Python' }).click();
  await page.getByLabel('Final Python', { exact: true }).fill(finalSolution);
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  await expect(page.getByRole('button', { name: 'Commit stock and submit challenge' })).toBeEnabled();
  await page.reload();
  await expect(page.getByText('Final experiment history (2 runs)', { exact: true })).toBeVisible();
});

test('storage filling between writes cannot attach an old result to a new run', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Original forecast source');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toBeVisible();
  await page.getByLabel('Your prediction').fill('New interrupted source');
  await page.getByLabel('Python code', { exact: true }).fill('while True:\n    pass');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let writes = 0;
    Storage.prototype.setItem = function (...args) {
      if (++writes > 1) throw new DOMException('Storage filled', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await run.click();
  await expect(page.getByRole('button', { name: 'Stop run', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Run interrupted when the game closed', { timeout: 125_000 });
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toHaveCount(0);
  await page.getByText('Previous successful forecast · run 1', { exact: true }).click();
  await expect(page.locator('.previous-run')).toContainText('Original forecast source');
});

test('resetting a running forecast keeps its interrupted evidence after reopening', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Keep the reset attempt');
  await page.getByLabel('Python code', { exact: true }).fill('while True:\n    pass');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 125_000 });
  await run.click();
  await expect(page.getByRole('button', { name: 'Stop run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset Python', exact: true }).click();
  await page.reload();
  await page.getByText('Forecast experiment history (1 runs)', { exact: true }).click();
  await page.getByText('Run 1: failed or interrupted', { exact: true }).click();
  await expect(page.locator('details[open]').last()).toContainText('Keep the reset attempt');
  await expect(page.locator('details[open]').last()).toContainText('interrupted');
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toHaveCount(0);
});

test('a second tab cannot edit or clear the active journey; it can resume after the first closes', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('The active tab owns this journey');
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByRole('alert')).toContainText('Another tab is using this journey');
  await expect(second.getByLabel('Your prediction')).toHaveCount(0);
  await expect(second.getByRole('button', { name: 'Start over', exact: true })).toBeDisabled();
  await page.getByLabel('Your prediction').fill('Latest work before closing');
  await page.close();
  await second.reload();
  await expect(second.getByLabel('Your prediction')).toHaveValue('Latest work before closing');
});
