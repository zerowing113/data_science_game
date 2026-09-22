import { expect, test } from '@playwright/test';

test.use({ actionTimeout: 15_000 });

test('visual errors explain the saved score and keep original dates through edits, failures and reopening', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab', exact: true }).click();
  const lab = page.getByRole('region', { name: 'Compare with a baseline', exact: true });
  await expect(lab.getByRole('region', { name: 'Planned evaluation split', exact: true })).toContainText('21 training days');
  await lab.getByLabel('Evaluation expectation').fill('Seventy each day should have a measurable error.');
  const editor = lab.getByLabel('Evaluation Python', { exact: true });
  await editor.fill('import pandas as pd\npredictions = pd.Series([70] * len(future), index=future.index)');
  await lab.getByLabel('Evaluation features').selectOption('promotions');
  await lab.getByRole('button', { name: 'Run comparison', exact: true }).click({ timeout: 60_000 });
  const visual = lab.getByRole('region', { name: 'Visual evaluation run 1', exact: true });
  await expect(visual).toBeVisible({ timeout: 60_000 });
  await expect(visual).toContainText('50.00 ÷ 7 days = 7.14 mugs/day');
  await expect(visual).toContainText('80.00 ÷ 7 days = 11.43 mugs/day');
  await expect(visual).toContainText('|70.00 − 62.00| = 8.00 mugs');
  await visual.getByRole('button', { name: 'Inspect errors on 2026-09-25', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(visual).toContainText('|70.00 − 82.00| = 12.00 mugs');
  await expect(visual).toContainText('|60.00 − 82.00| = 22.00 mugs');
  await lab.getByLabel('Chronological split').selectOption('14');
  await expect(lab.getByRole('region', { name: 'Planned evaluation split', exact: true })).toContainText('14 training days');
  await expect(visual).toContainText('21 training days');
  await expect(visual).toContainText('Draft changed');
  await editor.fill('raise ValueError("failed comparison")');
  await lab.getByRole('button', { name: 'Run comparison', exact: true }).click();
  await expect(lab.getByRole('alert')).toContainText('failed comparison');
  await expect(visual).toContainText('not the current attempt');
  await expect(lab.getByRole('region', { name: 'Visual evaluation run 2', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(visual).toContainText('50.00 ÷ 7 days = 7.14 mugs/day');
  await expect(visual).toContainText('21 training days');
  await expect(editor).toHaveValue('raise ValueError("failed comparison")');
});
