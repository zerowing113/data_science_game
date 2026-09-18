import { expect, test } from '@playwright/test';

test.use({ actionTimeout: 15_000 });

test('missing input fails before training-only median repair produces a scored forecast', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open missing-data lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Repair missing data' });
  await expect(lesson).toContainText('2 missing cells');
  await expect(lesson.getByRole('row', { name: '2026-09-10 Training Missing', exact: true })).toBeVisible();
  await expect(lesson.getByRole('row', { name: '2026-09-24 Evaluation Missing', exact: true })).toBeVisible();
  await expect(lesson.getByText('Why did this fail?', { exact: true })).toHaveCount(0);
  await lesson.getByLabel('Missing-data expectation').fill('The blank day values may prevent training.');
  const run = lesson.getByRole('button', { name: 'Run missing-data experiment', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const before = lesson.getByRole('article', { name: 'Missing-data run 1', exact: true });
  await expect(before).toContainText('Input X contains NaN', { timeout: 60_000 });
  await expect(before).toContainText('Failed — no forecast or score');
  await expect(before).not.toContainText('Model MAE');
  await lesson.getByText('Why did this fail?', { exact: true }).click();
  await expect(lesson).toContainText('Fit the imputer on training rows only');
  await lesson.getByLabel('Preparation choice').selectOption('median');
  await lesson.getByLabel('Missing-data expectation').fill('Training medians should allow predictions, with some remaining error.');
  const editor = lesson.getByLabel('Missing-data Python', { exact: true });
  await editor.fill((await editor.inputValue()) + '\nassert history["day"].median() == 10\nassert future["day"].median() == 24\nassert "demand" not in future.columns\nprint("Checked training median:", imputer.statistics_[0])');
  await run.click();
  const after = lesson.getByRole('article', { name: 'Missing-data run 2', exact: true });
  // Training days0..20 excluding10 have median10. Its exact recovery leaves
  // y=20+2*day+12*promotion. Eval day24 imputed10 predicts40 versus68.
  // All other six predictions exact: MAE28/7=4. Baseline errors sum80/7.
  await expect(after).toContainText('Model MAE: 4.00 mugs/day', { timeout: 60_000 });
  await expect(after).toContainText('Baseline MAE: 11.43 mugs/day');
  await expect(after.getByRole('row', { name: '2026-09-24 68.00 60.00 40.00 28.00', exact: true })).toBeVisible();
  await after.getByText('Saved output · run 2', { exact: true }).click();
  await expect(after).toContainText('Checked training median: 10.0');
  await expect(before).toContainText('The blank day values may prevent training.');
  await expect(lesson.getByRole('table', { name: 'Missing-data experiment comparison' }).getByRole('row')).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('custom preparation survives choices and reset while every attempt retains its own result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open missing-data lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Repair missing data' });
  const editor = lesson.getByLabel('Missing-data Python', { exact: true });
  const run = lesson.getByRole('button', { name: 'Run missing-data experiment', exact: true });
  await lesson.getByLabel('Missing-data expectation').fill('An incomplete input should fail.');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(lesson.getByRole('article', { name: 'Missing-data run 1', exact: true })).toContainText('Failed', { timeout: 60_000 });
  await lesson.getByLabel('Preparation choice').selectOption('median');
  const medianCode = await editor.inputValue();
  const customCode = medianCode.replace('features = ["day", "promotion"]', `# The intact date gives the exact elapsed day without learning from evaluation.
for frame in [history, future]:
    frame["day"] = (pd.to_datetime(frame["date"]) - pd.Timestamp("2026-08-31")).dt.days
features = ["day", "promotion"]`);
  await editor.fill(customCode);
  await lesson.getByLabel('Preparation choice').selectOption('untreated');
  await expect(editor).toHaveValue(customCode);
  await lesson.getByLabel('Missing-data expectation').fill('Deriving day from its date should restore the trend exactly.');
  await lesson.getByRole('button', { name: 'Reset missing-data Python', exact: true }).click();
  await expect(editor).toHaveValue(customCode);
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const saved = lesson.getByRole('article', { name: 'Missing-data run 2', exact: true });
  await expect(saved).toContainText('Model MAE: 0.00 mugs/day', { timeout: 60_000 });
  await editor.fill('while True:\n    pass');
  await run.click();
  await lesson.getByRole('button', { name: 'Stop missing-data run', exact: true }).click();
  await expect(lesson.getByRole('article', { name: 'Missing-data run 3', exact: true })).toContainText('Interrupted — no forecast or score');
  await expect(saved).toContainText('Model MAE: 0.00 mugs/day');
  await saved.getByText('Saved missing-data Python · run 2', { exact: true }).click();
  await expect(saved).toContainText('pd.Timestamp("2026-08-31")');
  await lesson.getByRole('button', { name: 'Reset missing-data Python', exact: true }).click();
  await expect(lesson.getByRole('article')).toHaveCount(3);
  await expect(saved).toContainText('Deriving day from its date should restore the trend exactly.');
});
