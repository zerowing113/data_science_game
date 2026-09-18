import { expect, test } from '@playwright/test';
test.use({ actionTimeout: 15_000 });

test('a learner inspects product-day history and knows what is available at forecast time', async ({ page }) => {
  await page.goto('/');
  const history = page.getByRole('region', { name: 'Explore the demand history' });
  await expect(history).toBeVisible();
  await expect(history).toContainText('Simulated store data');
  await expect(history).toContainText('noise-free');
  await expect(history).toContainText('one product on one day');
  await expect(history).toContainText('not fulfilled sales');
  const table = history.getByRole('table', { name: 'Historical observations · The Everyday Mug' });
  await expect(table.getByRole('row')).toHaveCount(29);
  await expect(table.getByRole('row', { name: '2026-08-31 0 0 20', exact: true })).toBeVisible();
  await expect(table.getByRole('row', { name: '2026-09-04 4 1 40', exact: true })).toBeVisible();
  await expect(table.getByRole('row', { name: '2026-09-27 27 0 74', exact: true })).toBeVisible();
  for (const [column, meaning] of [
    ['date', /known before the forecast/],
    ['day', /known before the forecast/],
    ['promotion', /planned before the forecast/],
    ['demand', /only observed after that day/],
  ] as const) {
    await table.getByRole('button', { name: `Explain ${column}`, exact: true }).click();
    await expect(history.getByRole('region', { name: 'Column explanation' })).toContainText(meaning);
    await expect(history.getByRole('region', { name: 'Column explanation' })).toContainText('Example:');
  }
});

test('selecting a historical row or chart point links the same observation in both views', async ({ page }) => {
  await page.goto('/');
  const viewer = page.getByRole('region', { name: 'Explore the demand history' });
  const date = viewer.getByRole('button', { name: '2026-09-04', exact: true });
  await expect(date).toBeVisible();
  await date.click();
  const point = viewer.getByRole('button', { name: 'Select observed demand on 2026-09-04: 40 mugs', exact: true });
  await expect(point).toHaveAttribute('aria-pressed', 'true');
  const lastPoint = viewer.getByRole('button', { name: 'Select observed demand on 2026-09-27: 74 mugs', exact: true });
  await lastPoint.focus();
  await page.keyboard.press('Enter');
  const lastDate = viewer.getByRole('button', { name: '2026-09-27', exact: true });
  await expect(lastDate).toHaveAttribute('aria-pressed', 'true');
  await expect(lastDate).toBeInViewport();
  await expect(point).toHaveAttribute('aria-pressed', 'false');
  const scroll = viewer.getByRole('tabpanel').getByLabel('Scrollable scenario records');
  await scroll.focus();
  await page.keyboard.press('Control+Home');
  // Keyboard scrolling animates; finish that user action before selecting again.
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(lastDate).not.toBeInViewport();
  await lastPoint.click();
  await expect(lastDate).toBeInViewport();
});

test('a learner sorts history and inspects future inputs without inventing observed demand', async ({ page }) => {
  await page.goto('/');
  const viewer = page.getByRole('region', { name: 'Explore the demand history' });
  await expect(viewer.getByLabel('Sort records')).toBeVisible();
  await viewer.getByLabel('Sort records').selectOption('demand-desc');
  await expect(viewer.getByRole('table').getByRole('row').nth(1)).toHaveText('2026-09-2626184');
  await viewer.getByRole('tab', { name: 'Upcoming week', exact: true }).click();
  const upcoming = viewer.getByRole('table', { name: 'Future inputs · The Everyday Mug' });
  await expect(upcoming.getByRole('row')).toHaveCount(8);
  await expect(upcoming.getByRole('row', { name: '2026-09-28 28 0 Unknown', exact: true })).toBeVisible();
  await expect(upcoming.getByRole('row', { name: '2026-10-02 32 1 Unknown', exact: true })).toBeVisible();
  await expect(viewer.getByRole('button', { name: /Select predicted demand/ })).toHaveCount(0);
  await upcoming.getByRole('button', { name: 'Explain demand', exact: true }).click();
  await expect(viewer.getByRole('region', { name: 'Column explanation' })).toContainText('Future demand is unknown');
});

test('real Python receives the displayed fixture and upcoming rows link only to computed predictions', async ({ page }) => {
  await page.goto('/');
  const viewer = page.getByRole('region', { name: 'Explore the demand history' });
  await expect(viewer.getByRole('row', { name: '2026-09-04 4 1 40', exact: true })).toBeVisible();
  await expect(viewer.getByRole('button', { name: 'Select observed demand on 2026-09-04: 40 mugs', exact: true })).toBeVisible();
  await page.getByLabel('Your prediction').fill('The same historical promotion day should be present in Python.');
  await page.getByLabel('Python code').fill(`print(history.iloc[[0, 4, 27]].to_csv(index=False).strip())
print(future.iloc[[0, 4]].to_csv(index=False).strip())
predictions = [76, 78, 80, 82, 96, 98, 88]`);
  await expect(page.getByRole('button', { name: 'Run forecast', exact: true })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Run forecast', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Forecast ready', { timeout: 60_000 });
  await page.getByText('Python output', { exact: true }).click();
  const output = page.locator('.python-output');
  await expect(output).toContainText('0,2026-08-31,0,20');
  await expect(output).toContainText('4,2026-09-04,1,40');
  await expect(output).toContainText('27,2026-09-27,0,74');
  await expect(output).toContainText('28,2026-09-28,0');
  await expect(output).toContainText('32,2026-10-02,1');
  await viewer.getByLabel('Sort records').selectOption('demand-desc');
  await viewer.getByRole('button', { name: 'Select predicted demand on 2026-10-02: 96.0 mugs', exact: true }).click();
  await expect(viewer.getByLabel('Sort records')).toHaveValue('date-asc');
  await expect(viewer.getByRole('tab', { name: 'Upcoming week', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(viewer.getByRole('button', { name: '2026-10-02', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(viewer.getByRole('row', { name: '2026-10-02 32 1 Unknown', exact: true })).toBeVisible();
  await viewer.getByRole('button', { name: '2026-09-28', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Select predicted demand on 2026-09-28: 76.0 mugs', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
