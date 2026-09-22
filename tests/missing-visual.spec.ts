import { expect, test } from '@playwright/test';

test('missing cells and repair guidance stay distinct from actual saved Python outcomes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open missing-data lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Repair missing data' });
  const map = lesson.getByRole('region', { name: 'Incomplete export map' });
  await expect(map.getByLabel('2026-09-10: Training, day missing', { exact: true })).toBeVisible();
  await expect(map.getByLabel('2026-09-24: Evaluation, day missing', { exact: true })).toBeVisible();
  await expect(map.getByLabel('2026-08-31: Training, day 0', { exact: true })).toContainText('0');
  await expect(map).toContainText('Missing is not zero');
  await lesson.getByLabel('Missing-data expectation').fill('Inspect gaps before repairing them.');
  const run = lesson.getByRole('button', { name: 'Run missing-data experiment', exact: true });
  const editor = lesson.getByLabel('Missing-data Python', { exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const first = lesson.getByRole('article', { name: 'Missing-data run 1', exact: true });
  await expect(first).toContainText('The model received missing inputs', { timeout: 60_000 });
  await first.getByText('Full technical details', { exact: true }).click();
  await expect(first.locator('pre').first()).toBeVisible();
  await expect(first).toContainText('Input X contains NaN');
  await lesson.getByLabel('Preparation choice').selectOption('median');
  const repair = await editor.inputValue();
  await editor.fill('raise NotImplementedError("Write the preparation block")');
  await run.click();
  const unfinished = lesson.getByRole('article', { name: 'Missing-data run 2', exact: true });
  await expect(unfinished).toContainText('The preparation block is unfinished', { timeout: 60_000 });
  await expect(unfinished).toContainText('Replace the placeholder');
  await editor.fill(repair);
  await lesson.getByLabel('Preparation choice').selectOption('untreated');
  // Keep custom Python independent of the visual selection.
  await editor.fill(repair + '\nprint("Learner training median", imputer.statistics_[0])');
  await run.click();
  const success = lesson.getByRole('article', { name: 'Missing-data run 3', exact: true });
  await expect(success).toContainText('Model MAE: 4.00 mugs/day', { timeout: 60_000 });
  await expect(success).toContainText('Preparation method is not automatically verified');
  const unrelatedCode = 'raise ValueError("Write the preparation block: unrelated example")';
  await editor.fill(unrelatedCode);
  await run.click();
  const other = lesson.getByRole('article', { name: 'Missing-data run 4', exact: true });
  await expect(other).toContainText('Python could not finish this run', { timeout: 60_000 });
  await expect(other).not.toContainText('The preparation block is unfinished');
  await expect(other).not.toContainText('The model received missing inputs');
  await page.reload();
  await expect(editor).toHaveValue(unrelatedCode);
  await expect(success).toContainText('Model MAE: 4.00 mugs/day');
  await expect(first).toContainText('The model received missing inputs');
  await expect(unfinished).toContainText('The preparation block is unfinished');
  await expect(other).toContainText('Python could not finish this run');
  await lesson.getByText('How training-only preparation works', { exact: true }).click();
  await expect(lesson).toContainText('Illustration only');
  await expect(lesson).toContainText('Learn once from training');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a later custom exception is not mistaken for an earlier preparation failure', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open missing-data lesson' }).click();
  const lesson = page.getByRole('region', { name: 'Repair missing data' });
  await lesson.getByLabel('Missing-data expectation').fill('Inspect the final error in a chain.');
  await lesson.getByLabel('Missing-data Python', { exact: true }).fill(`class Halt(Exception):
    pass
try:
    raise NotImplementedError("Write the preparation block")
except NotImplementedError:
    raise Halt("A different failure ended this run")`);
  const run = lesson.getByRole('button', { name: 'Run missing-data experiment', exact: true });
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  const record = lesson.getByRole('article', { name: 'Missing-data run 1', exact: true });
  await expect(record).toContainText('Python could not finish this run', { timeout: 60_000 });
  await expect(record).not.toContainText('The preparation block is unfinished');
  const details = record.getByText('Full technical details', { exact: true });
  await details.focus();
  await details.press('Enter');
  await expect(record.locator('.missing-error')).toBeVisible();
  await expect(record.locator('.missing-error')).toContainText('Halt: A different failure ended this run');
});
