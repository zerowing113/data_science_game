import { expect, test } from '@playwright/test';

test.use({ actionTimeout: 15_000 });

test('a learner stocks from a real forecast and reveals exact-stock business outcomes', async ({ page }) => {
  await page.goto('/');
  const shop = page.getByRole('region', { name: 'Stock the shop' });
  await expect(shop).toContainText('Complete an upcoming-week forecast to plan stock.');
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  await page.getByLabel('Your prediction').fill('Promotions should raise the stock needed.');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await shop.getByRole('button', { name: 'Plan stock from forecast run 1', exact: true }).click();
  await expect(shop).toContainText('$12.00 sale price');
  await expect(shop).toContainText('$5.00 purchase cost');
  await expect(shop).toContainText('$1.00 recovered per leftover');
  await expect(shop.getByRole('article')).toHaveCount(0);
  await expect(shop.getByLabel('Stock for 2026-09-28')).toHaveValue('76');
  await shop.getByRole('button', { name: 'Advance shop and reveal demand', exact: true }).click();
  const outcome = shop.getByRole('article', { name: 'Stocking decision 1', exact: true });
  // Known week: 76+78+80+82+96+98+88 = 598. Exact stock earns 598*(12-5).
  await expect(outcome).toContainText('Forecast run 1');
  await expect(outcome).toContainText('Demand: 598');
  await expect(outcome).toContainText('Fulfilled orders: 598');
  await expect(outcome).toContainText('Lost sales: 0');
  await expect(outcome).toContainText('Leftover inventory: 0');
  await expect(outcome).toContainText('Profit: $4,186.00');
  await expect(outcome.getByRole('row', { name: '2026-09-28 76.0 76 76 76 0 0 $532.00', exact: true })).toBeVisible();
  await expect(outcome.getByRole('img', { name: '2026-09-28: 76 fulfilled, 0 lost sales, 0 leftover' })).toBeVisible();
  await expect(shop).toContainText('Profit is business feedback, not proof of model quality.');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('understock and overstock replays retain their source forecasts and comparable outcomes', async ({ page }) => {
  await page.goto('/');
  const shop = page.getByRole('region', { name: 'Stock the shop' });
  const editor = page.getByLabel('Python code', { exact: true });
  await page.getByLabel('Your prediction').fill('Sixty per day will leave some demand unmet.');
  await editor.fill('predictions = [60] * 7');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await shop.getByRole('button', { name: 'Plan stock from forecast run 1', exact: true }).click();
  await shop.getByRole('button', { name: 'Advance shop and reveal demand', exact: true }).click();
  const under = shop.getByRole('article', { name: 'Stocking decision 1', exact: true });
  // 7*60 sold = 420; 598-420 = 178 unmet; 420*(12-5) = 2940 profit.
  await expect(under).toContainText('Fulfilled orders: 420');
  await expect(under).toContainText('Lost sales: 178');
  await expect(under).toContainText('Leftover inventory: 0');
  await expect(under).toContainText('Profit: $2,940.00');
  await expect(under.getByRole('img', { name: '2026-09-28: 60 fulfilled, 16 lost sales, 0 leftover' })).toBeVisible();
  await expect(under.getByRole('img', { name: '2026-09-29: 60 fulfilled, 18 lost sales, 0 leftover' })).toBeVisible();
  await expect(shop.getByRole('button', { name: 'Advance shop and reveal demand', exact: true })).toBeDisabled();

  await editor.fill('predictions = [100] * 7');
  await page.getByLabel('Your prediction').fill('One hundred each day should cover demand, with leftovers.');
  await run.click();
  await expect(shop.getByRole('button', { name: 'Plan stock from forecast run 2', exact: true })).toBeVisible();
  await expect(shop.getByRole('heading', { name: 'Planning from forecast run 1', exact: true })).toBeVisible();
  await shop.getByRole('button', { name: 'Plan stock from forecast run 2', exact: true }).click();
  await shop.getByRole('button', { name: 'Advance shop and reveal demand', exact: true }).click();
  const over = shop.getByRole('article', { name: 'Stocking decision 2', exact: true });
  // 700 stocked, 598 sold, 102 cleared. 598*12 + 102*1 - 700*5 = 3778.
  await expect(over).toContainText('Forecast run 2');
  await expect(over).toContainText('Demand: 598');
  await expect(over).toContainText('Fulfilled orders: 598');
  await expect(over).toContainText('Lost sales: 0');
  await expect(over).toContainText('Leftover inventory: 102');
  await expect(over).toContainText('Profit: $3,778.00');
  await expect(over).toContainText('Replay of already revealed demand.');
  await expect(over.getByRole('img', { name: '2026-09-28: 76 fulfilled, 0 lost sales, 24 leftover' })).toBeVisible();
  await expect(over.getByRole('row', { name: '2026-09-29 100.0 100 78 78 0 22 $458.00', exact: true })).toBeVisible();
  await under.getByText('Source forecast · decision 1', { exact: true }).click();
  await expect(under).toContainText('predictions = [60] * 7');
  await expect(under).toContainText('Sixty per day will leave some demand unmet.');
  await over.getByText('Source forecast · decision 2', { exact: true }).click();
  await expect(over).toContainText('predictions = [100] * 7');
  const comparison = shop.getByRole('table', { name: 'Stocking comparison', exact: true });
  await expect(comparison.getByRole('row')).toHaveCount(3);
  await expect(comparison).toContainText('$2,940.00');
  await expect(comparison).toContainText('$3,778.00');
});

test('invalid stock is blocked and a failed Python attempt cannot replace the selected forecast', async ({ page }) => {
  await page.goto('/');
  const shop = page.getByRole('region', { name: 'Stock the shop' });
  const editor = page.getByLabel('Python code', { exact: true });
  await editor.fill('predictions = [0] * 7');
  await page.getByLabel('Your prediction').fill('Ordering nothing will lose all demand.');
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await shop.getByRole('button', { name: 'Plan stock from forecast run 1', exact: true }).click();
  const firstStock = shop.getByLabel('Stock for 2026-09-28');
  const advance = shop.getByRole('button', { name: 'Advance shop and reveal demand', exact: true });
  for (const invalid of ['', '-1', '1.5', '10001']) {
    await firstStock.fill(invalid);
    await expect(advance).toBeDisabled();
    await expect(shop.getByRole('article')).toHaveCount(0);
  }
  await firstStock.fill('0');
  await editor.fill('raise ValueError("This attempt has no forecast")');
  await run.click();
  await expect(page.getByRole('alert')).toContainText('This attempt has no forecast');
  await expect(shop).toContainText('Latest completed forecast: run 1');
  await page.getByRole('button', { name: 'Reset Python', exact: true }).click();
  await advance.click();
  const outcome = shop.getByRole('article', { name: 'Stocking decision 1', exact: true });
  await expect(outcome).toContainText('Forecast run 1');
  await expect(outcome).toContainText('Demand: 598');
  await expect(outcome).toContainText('Fulfilled orders: 0');
  await expect(outcome).toContainText('Lost sales: 598');
  await expect(outcome).toContainText('Leftover inventory: 0');
  await expect(outcome).toContainText('Profit: $0.00');
  await expect(advance).toBeDisabled();
  await shop.getByRole('button', { name: 'Revise stock for a replay' }).click();
  await firstStock.fill('1');
  await advance.click();
  await expect(shop.getByRole('article')).toHaveCount(2);
  await expect(outcome).toContainText('Lost sales: 598');
  const replay = shop.getByRole('article', { name: 'Stocking decision 2', exact: true });
  await expect(replay).toContainText('Lost sales: 597');
  await expect(replay).toContainText('Profit: $7.00');
  await expect(replay).toContainText('Replay of already revealed demand.');
});
