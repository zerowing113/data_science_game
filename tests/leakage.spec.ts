import { expect, test } from '@playwright/test';

test.use({ actionTimeout: 15_000 });

test('a tempting historical score fails at forecast time and removing the late feature creates a valid comparison', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open leakage lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Investigate feature timing' });
  await lesson.getByText('Inspect feature timing', { exact: true }).click();
  await expect(lesson).toContainText('Only after the shop closes');
  await expect(lesson.getByText(/Using an answer-derived column is leakage/)).toHaveCount(0);
  await lesson.getByLabel('Leakage expectation').fill('The closing report should predict demand well.');
  const run = lesson.getByRole('button', { name: 'Run timing experiment', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const first = lesson.getByRole('article', { name: 'Timing experiment 1', exact: true });
  await expect(first).toContainText('Historical model MAE: 0.00 mugs/day', { timeout: 60_000 });
  await expect(first).toContainText('Baseline MAE: 11.43 mugs/day');
  await expect(first).toContainText('Validity: leaked');
  await expect(first).toContainText('Forecast-time execution failed');
  await expect(first).toContainText('closing_requested_units');
  await expect(first.getByRole('table', { name: 'Upcoming predictions' })).toHaveCount(0);
  await expect(lesson.getByText(/Using an answer-derived column is leakage/)).toBeVisible();
  await expect(lesson).toContainText('Only after the shop closes');
  const editor = lesson.getByLabel('Leakage Python', { exact: true });
  await editor.fill((await editor.inputValue()).replace('["closing_requested_units"]', '["day", "promotion"]'));
  await lesson.getByLabel('Leakage expectation').fill('Known dates and planned promotions should work at forecast time.');
  await run.click();
  const second = lesson.getByRole('article', { name: 'Timing experiment 2', exact: true });
  await expect(second).toContainText('Validity: valid', { timeout: 60_000 });
  await expect(second).toContainText('Historical model MAE: 0.00 mugs/day');
  await expect(second.getByRole('table', { name: 'Upcoming predictions' })).toContainText('76.00');
  await expect(first).toContainText('Validity: leaked');
  await expect(first).toContainText('The closing report should predict demand well.');
});

test('reset retains the interrupted timing attempt and a fresh run cannot replace its validity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open leakage lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Investigate feature timing' });
  const editor = lesson.getByLabel('Leakage Python', { exact: true });
  await lesson.getByLabel('Timing features').selectOption('known');
  const validCode = await editor.inputValue();
  await lesson.getByLabel('Leakage expectation').fill('An interrupted attempt must remain unverified.');
  await editor.fill('while True:\n    pass');
  const run = lesson.getByRole('button', { name: 'Run timing experiment', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(lesson.getByRole('button', { name: 'Stop timing experiment' })).toBeVisible();
  await lesson.getByRole('button', { name: 'Reset timing Python' }).click();
  const interrupted = lesson.getByRole('article', { name: 'Failed timing attempt 1', exact: true });
  await expect(interrupted).toContainText('Validity: unverified');
  await expect(interrupted).toContainText('Interrupted by resetting Python');
  await editor.fill(validCode);
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(lesson.getByRole('article', { name: 'Timing experiment 2', exact: true })).toContainText('Validity: valid', { timeout: 60_000 });
  await expect(interrupted).toContainText('Validity: unverified');
  await expect(lesson.getByRole('article', { name: 'Timing experiment 1', exact: true })).toHaveCount(0);
});

test('custom forecast-time mutations cannot change the required prediction dates or count', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open leakage lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Investigate feature timing' });
  await lesson.getByLabel('Leakage expectation').fill('Upcoming output must still match the original seven requested dates.');
  const run = lesson.getByRole('button', { name: 'Run timing experiment', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  const mutations = [
    ['future = pd.concat([future, future.iloc[[0]]])', 'Return exactly 7 predictions'],
    ['future.index = future.index[::-1]', 'Evaluation dates must match'],
  ];
  for (const [index, [mutation, expectedError]] of mutations.entries()) {
    await lesson.getByLabel('Leakage Python', { exact: true }).fill(`import pandas as pd\nif len(history) == 28:\n    ${mutation}\npredictions = pd.Series([70] * len(future), index=future.index)`);
    await run.click();
    const record = lesson.getByRole('article', { name: `Timing experiment ${index + 1}`, exact: true });
    await expect(record).toContainText('Historical model MAE: 7.14 mugs/day', { timeout: 60_000 });
    await expect(record).toContainText('Validity: unverified');
    await expect(record).toContainText(expectedError);
    await expect(record.getByRole('table', { name: 'Upcoming predictions' })).toHaveCount(0);
  }
});

test('validity follows saved executed code, and unsupported or failed attempts never inherit a valid result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open leakage lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Investigate feature timing' });
  const editor = lesson.getByLabel('Leakage Python', { exact: true });
  const run = lesson.getByRole('button', { name: 'Run timing experiment', exact: true });
  await lesson.getByLabel('Leakage expectation').fill('Verify timing from execution, not my visual choice.');
  const closingCode = await editor.inputValue();
  await lesson.getByLabel('Timing features').selectOption('known');
  const knownCode = await editor.inputValue();
  await editor.fill(closingCode);
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const first = lesson.getByRole('article', { name: 'Timing experiment 1', exact: true });
  await expect(first).toContainText('Validity: leaked', { timeout: 60_000 });
  await expect(first).toContainText('Visual choice: Trend + planned promotions');
  await editor.fill('# My explanation does not change the model.\n\n' + knownCode.replace('features = ', 'features    =    '));
  await run.click();
  await expect(lesson.getByRole('article', { name: 'Timing experiment 2', exact: true })).toContainText('Validity: valid', { timeout: 60_000 });
  // Keeping a safe model in scope does not certify predictions replaced by custom code.
  await editor.fill(knownCode + '\npredictions = pd.Series([70] * len(future), index=future.index)');
  await run.click();
  const custom = lesson.getByRole('article', { name: 'Timing experiment 3', exact: true });
  await expect(custom).toContainText('Validity: unverified', { timeout: 60_000 });
  await expect(custom).toContainText('Historical model MAE: 7.14 mugs/day');
  await editor.fill('raise ValueError("Retry this timing attempt")');
  await run.click();
  const failed = lesson.getByRole('article', { name: 'Failed timing attempt 4', exact: true });
  await expect(failed).toContainText('Validity: unverified');
  await lesson.getByRole('button', { name: 'Reset timing Python' }).click();
  await expect(failed).toContainText('Retry this timing attempt');
  await expect(lesson.getByRole('article', { name: 'Timing experiment 2', exact: true })).toContainText('Validity: valid');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
