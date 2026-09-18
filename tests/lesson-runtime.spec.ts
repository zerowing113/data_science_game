import { expect, test } from '@playwright/test';

test('all four workspaces can load together and run independent real models', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open evaluation lab' }).click();
  await page.getByRole('button', { name: 'Open missing-data lesson' }).click();
  await page.getByRole('button', { name: 'Open leakage lesson' }).click();
  await page.getByLabel('Your prediction').fill('The upcoming forecast should run.');
  const evaluation = page.getByRole('region', { name: 'Compare with a baseline' });
  const missing = page.getByRole('region', { name: 'Repair missing data' });
  const timing = page.getByRole('region', { name: 'Investigate feature timing' });
  await evaluation.getByLabel('Evaluation expectation').fill('Promotions should explain demand.');
  await evaluation.getByLabel('Evaluation features').selectOption('promotions');
  await missing.getByLabel('Missing-data expectation').fill('The missing field should fail.');
  await timing.getByLabel('Leakage expectation').fill('Known inputs should run honestly.');
  await timing.getByLabel('Timing features').selectOption('known');
  const forecastRun = page.getByRole('button', { name: 'Run forecast', exact: true });
  const evaluationRun = evaluation.getByRole('button', { name: 'Run comparison', exact: true });
  const missingRun = missing.getByRole('button', { name: 'Run missing-data experiment', exact: true });
  const timingRun = timing.getByRole('button', { name: 'Run timing experiment', exact: true });
  for (const button of [forecastRun, evaluationRun, missingRun, timingRun]) {
    await expect(button).toBeEnabled({ timeout: 90_000 });
  }
  await forecastRun.click();
  await evaluationRun.click();
  await missingRun.click();
  await timingRun.click();
  await expect(page.getByRole('table', { name: 'Daily forecast · latest completed run', exact: true })).toBeVisible();
  await expect(evaluation.getByRole('article', { name: 'Evaluation run 1', exact: true })).toContainText('Model MAE: 0.00');
  await expect(missing.getByRole('article', { name: 'Missing-data run 1', exact: true })).toContainText('Failed — no forecast or score');
  await expect(timing.getByRole('article', { name: 'Timing experiment 1', exact: true })).toContainText('Validity: valid');
});
