import { expect, test } from '@playwright/test';

test.use({ actionTimeout: 15_000 });

test('missing runtime packages prevent false readiness and resetting recovers after downloads return', async ({ page }) => {
  await page.route('**/python/scipy-*.whl', (route) => route.abort('failed'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab' }).click();
  const lab = page.getByRole('region', { name: 'Compare with a baseline' });
  await lab.getByLabel('Evaluation expectation').fill('A complete runtime should train the model.');
  await expect(lab.getByRole('alert')).toContainText('Python could not load', { timeout: 30_000 });
  await expect(lab.getByRole('button', { name: 'Run comparison', exact: true })).toBeDisabled();
  await expect(lab.getByRole('article')).toHaveCount(0);
  await page.unroute('**/python/scipy-*.whl');
  await lab.getByRole('button', { name: 'Reset evaluation Python', exact: true }).click();
  await lab.getByLabel('Evaluation features').selectOption('promotions');
  const run = lab.getByRole('button', { name: 'Run comparison', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(lab.getByRole('article', { name: 'Evaluation run 1', exact: true })).toContainText('Model MAE: 0.00 mugs/day', { timeout: 60_000 });
});

test('a real model and a last-demand baseline are scored on the same later days', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab' }).click();
  const lab = page.getByRole('region', { name: 'Compare with a baseline' });
  await expect(lab).toContainText('2026-08-31 – 2026-09-20');
  await expect(lab).toContainText('2026-09-21 – 2026-09-27');
  await lab.getByLabel('Evaluation features').selectOption('promotions');
  await lab.getByLabel('Evaluation expectation').fill('Promotions should explain the remaining variation.');
  const run = lab.getByRole('button', { name: 'Run comparison', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const result = lab.getByRole('article', { name: 'Evaluation run 1' });
  await expect(result).toBeVisible({ timeout: 60_000 });
  // Last training demand is 60. Later demands: 62,64,66,68,82,84,74.
  // Absolute errors sum to 80, hence baseline MAE = 80/7 = 11.43.
  await expect(result).toContainText('Baseline MAE: 11.43 mugs/day');
  await expect(result).toContainText('Model MAE: 0.00 mugs/day');
  await expect(result.getByRole('row', { name: '2026-09-25 82.00 60.00 82.00 22.00 0.00', exact: true })).toBeVisible();
  await expect(result).toContainText('LinearRegression');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a learner compares real feature experiments and keeps different splits distinct', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab' }).click();
  const lab = page.getByRole('region', { name: 'Compare with a baseline' });
  await lab.getByLabel('Evaluation expectation').fill('Trend alone may miss promotions.');
  const run = lab.getByRole('button', { name: 'Run comparison', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const first = lab.getByRole('article', { name: 'Evaluation run 1', exact: true });
  await expect(first).toBeVisible({ timeout: 60_000 });
  // OLS fitted on days 0–20: slope 2 + 108/770, intercept 22.025974...
  await expect(first).toContainText('Model MAE: 5.62 mugs/day');
  await lab.getByLabel('Evaluation features').selectOption('promotions');
  await lab.getByLabel('Evaluation expectation').fill('Adding the planned promotion should improve MAE.');
  const editor = lab.getByLabel('Evaluation Python', { exact: true });
  await editor.fill((await editor.inputValue()).replace('LinearRegression()', 'LinearRegression(copy_X=False)'));
  await run.click();
  const second = lab.getByRole('article', { name: 'Evaluation run 2', exact: true });
  await expect(second).toBeVisible({ timeout: 60_000 });
  const comparisons = lab.getByRole('table', { name: 'Experiment comparison' });
  await expect(comparisons).toBeVisible();
  await expect(comparisons.getByRole('row')).toHaveCount(3);
  await expect(second).toContainText('Model MAE: 0.00 mugs/day');
  await expect(first).toContainText('Trend only');
  await expect(first).toContainText('Trend alone may miss promotions.');
  await expect(second).toContainText('Trend + promotions');
  await expect(first).toContainText("'copy_X': True");
  await expect(second).toContainText("'copy_X': False");
  await second.getByText('Saved evaluation Python · run 2', { exact: true }).click();
  await expect(second).toContainText('features = ["day", "promotion"]');

  await lab.getByLabel('Chronological split').selectOption('14');
  await expect(first).toContainText('2026-09-21 – 2026-09-27');
  await run.click();
  const third = lab.getByRole('article', { name: 'Evaluation run 3', exact: true });
  await expect(third).toBeVisible({ timeout: 60_000 });
  await expect(third).toContainText('2026-09-14 – 2026-09-27');
  // Last training demand = 46; fourteen later actuals sum to 902.
  // Baseline MAE = (902 - 14*46)/14 = 18.43.
  await expect(third).toContainText('Baseline MAE: 18.43 mugs/day');
  await expect(third).toContainText('Model MAE: 0.00 mugs/day');
  await expect(third.getByRole('table').getByRole('row')).toHaveCount(15);
  await expect(comparisons.getByRole('row')).toHaveCount(4);
  await expect(lab).toContainText('Different evaluation dates: compare scores only within the same split.');
});

test('invalid or misaligned outputs cannot create scores and a corrected rerun succeeds', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab' }).click();
  const lab = page.getByRole('region', { name: 'Compare with a baseline' });
  const editor = lab.getByLabel('Evaluation Python', { exact: true });
  const run = lab.getByRole('button', { name: 'Run comparison', exact: true });
  await lab.getByLabel('Evaluation expectation').fill('Seventy mugs should be closer than sixty.');
  const validCode = 'import pandas as pd\nassert len(history) == 21\nassert history["day"].max() == 20\nassert "demand" not in future.columns\npredictions = pd.Series([70] * len(future), index=future.index)';
  await editor.fill(validCode);
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const first = lab.getByRole('article', { name: 'Evaluation run 1', exact: true });
  await expect(first).toBeVisible({ timeout: 60_000 });
  // |62-70|+|64-70|+|66-70|+|68-70|+|82-70|+|84-70|+|74-70| = 50.
  await expect(first).toContainText('Model MAE: 7.14 mugs/day');
  const invalidCases = [
    ['predictions = [70] * len(future)', 'pandas Series'],
    ['predictions = pd.Series([70] * 6, index=future.index[:6])', 'exactly 7'],
    ['predictions = pd.Series([float("nan")] * 7, index=future.index)', 'finite, non-negative'],
    ['predictions = pd.Series([-1] * 7, index=future.index)', 'finite, non-negative'],
    ['predictions = pd.Series([70] * 7, index=future.index[::-1])', 'Evaluation dates must match'],
    ['predictions = pd.Series([70] * 7, index=[future.index[0]] * 7)', 'Evaluation dates must match'],
  ];
  for (const [code, message] of invalidCases) {
    await editor.fill(`import pandas as pd\n${code}`);
    await run.click();
    await expect(lab.getByRole('alert')).toContainText(message);
    await expect(lab.getByRole('article')).toHaveCount(1);
    await expect(first).toContainText('Model MAE: 7.14 mugs/day');
  }
  await lab.getByRole('button', { name: 'Reset evaluation Python', exact: true }).click();
  await expect(lab.getByRole('article')).toHaveCount(1);
  await editor.fill(validCode);
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(lab.getByRole('article')).toHaveCount(2, { timeout: 60_000 });
  await expect(lab.getByRole('alert')).toHaveCount(0);
});
