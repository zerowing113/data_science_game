import { expect, test } from '@playwright/test';

test('a learner trains a real model and sees the next seven days of demand', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your first forecast' })).toBeVisible();
  await expect(page.getByText('Next 7 days', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  await page.getByLabel('Your prediction').fill('The promotion days should have higher demand.');
  await expect(page.getByLabel('Python code')).toHaveValue(/"day", "promotion"/);
  await expect(page.getByRole('button', { name: 'Run forecast', exact: true })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Run forecast', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Forecast ready', { timeout: 60_000 });
  await expect(page.getByRole('group', { name: /Demand forecast chart/ })).toBeVisible();
  // Worked fixture: day 28 has demand 20 + 2*28 = 76;
  // day 32 has a scheduled promotion, adding 12 to 20 + 2*32 = 96.
  await expect(page.getByRole('row', { name: 'Mon Sep 28 76.0' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Fri Oct 02 96.0' })).toBeVisible();
  await expect(page.getByText('The promotion days should have higher demand.', { exact: true })).toBeVisible();
});

test('a code edit changes computed demand and a broken run cannot reuse old predictions', async ({ page }) => {
  await page.goto('/');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeDisabled();
  await page.getByLabel('Your prediction').fill('   ');
  await expect(run).toBeDisabled();
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  await page.getByLabel('Your prediction').fill('Adding five will lift each daily forecast.');
  const editor = page.getByLabel('Python code');
  await editor.fill((await editor.inputValue()).replace(
    'predictions = model.predict(future[features])',
    'predictions = model.predict(future[features]) + 5',
  ));
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByRole('status')).toContainText('Forecast ready', { timeout: 60_000 });
  await expect(page.getByRole('row', { name: 'Mon Sep 28 81.0' })).toBeVisible();
  await editor.fill('print("This script did not create predictions")');
  await expect(page.getByText('Code changed since this forecast. Run again to update the results.')).toBeVisible();
  await run.click();
  await expect(page.getByRole('alert')).toContainText('NameError');
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toHaveCount(0);
  await expect(page.getByRole('group', { name: /Demand forecast chart/ })).toHaveCount(0);
});

test('visual choices preserve a custom multiline Python assignment', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByLabel('Python code');
  const customCode = (await editor.inputValue()).replace('features = ["day"]', 'features = [\n    "day"\n]');
  await editor.fill(customCode);
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  await expect(editor).toHaveValue(customCode);
  await expect(page.getByText(/Custom features code is preserved/)).toBeVisible();
  await page.getByRole('button', { name: 'Restore starter' }).click();
  await expect(editor).toHaveValue(/features = \["day", "promotion"\]/);
  await expect(page.getByText(/Custom features code is preserved/)).toHaveCount(0);
});
