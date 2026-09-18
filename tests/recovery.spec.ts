import { expect, test } from '@playwright/test';

test('a learner stops unfinished Python, resets, and runs corrected code without reloading', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('A fresh session will run my corrected forecast.');
  const editor = page.getByLabel('Python code');
  await editor.fill('while True:\n    pass');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByRole('button', { name: 'Stop run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Stop run', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Run stopped');
  await expect(editor).toHaveValue('while True:\n    pass');
  await page.getByRole('button', { name: 'Reset Python', exact: true }).click();
  await expect(page.getByLabel('Your prediction')).toHaveValue('A fresh session will run my corrected forecast.');
  await editor.fill('predictions = [42] * 7');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByRole('status')).toContainText('Forecast ready');
  await expect(page.getByRole('row', { name: 'Mon Sep 28 42.0' })).toBeVisible();
});

test('a failed experiment keeps its previous forecast attributed and corrected Python succeeds', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByLabel('Python code');
  const expectation = page.getByLabel('Your prediction');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expectation.fill('My original experiment predicts 42 mugs per day.');
  await editor.fill('predictions = [42] * 7');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByRole('row', { name: 'Mon Sep 28 42.0' })).toBeVisible();

  await expectation.fill('This second experiment tests error recovery.');
  await editor.fill('raise ValueError("Choose a valid demand feature")');
  await run.click();
  await expect(page.getByRole('alert')).toContainText('ValueError: Choose a valid demand feature');
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toHaveCount(0);
  await page.getByText('Previous successful forecast · run 1', { exact: true }).click();
  await expect(page.getByRole('table', { name: 'Previous forecast · run 1' })).toContainText('42.0');
  const prior = page.locator('details').filter({ hasText: 'Previous successful forecast · run 1' });
  await expect(prior).toContainText('My original experiment predicts 42 mugs per day.');
  await expect(prior).toContainText('predictions = [42] * 7');
  await expect(prior).not.toContainText('This second experiment tests error recovery.');

  await editor.fill('predictions = [55] * 7');
  await run.click();
  await expect(page.getByRole('status')).toContainText('Forecast ready');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('row', { name: 'Mon Sep 28 55.0' })).toBeVisible();
  await expect(page.getByText('This second experiment tests error recovery.', { exact: true })).toBeVisible();
});

test('resetting during an unfinished execution prevents its late result from replacing a newer forecast', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Only my replacement experiment should produce the forecast.');
  const editor = page.getByLabel('Python code');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await editor.fill('import asyncio\nawait asyncio.sleep(10)\npredictions = [999] * 7');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const originalCompletion = Date.now() + 11_000;
  await expect(page.getByRole('button', { name: 'Stop run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset Python', exact: true }).click();
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toHaveCount(0);
  await editor.fill('predictions = [17] * 7');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByRole('row', { name: 'Mon Sep 28 17.0' })).toBeVisible();
  // Observe beyond the abandoned execution's scheduled completion time.
  await page.waitForTimeout(Math.max(0, originalCompletion - Date.now()));
  await expect(page.getByRole('row', { name: 'Mon Sep 28 17.0' })).toBeVisible();
  await expect(page.getByRole('table', { name: /Daily forecast/ })).not.toContainText('999.0');
});
