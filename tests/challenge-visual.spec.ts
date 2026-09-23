import { expect, test } from '@playwright/test';

test('the final visual journey reveals only committed outcomes and reopens the same completed recap', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  const challenge = page.getByRole('region', { name: 'Final challenge', exact: true });
  const week = challenge.getByRole('region', { name: 'Final forecast week', exact: true });
  await expect(week).toContainText('2026-10-26');
  await expect(week).toContainText('Demand stays hidden until stock is committed');
  await expect(challenge.getByRole('region', { name: 'Shop playback', exact: true })).toHaveCount(0);
  await expect(challenge.getByRole('region', { name: 'Visual evaluation run 1', exact: true })).toHaveCount(0);
  const editor = challenge.getByLabel('Final Python', { exact: true });
  await challenge.getByLabel('Final expectation').fill('Use available inputs, then inspect the committed outcome.');
  const run = challenge.getByRole('button', { name: 'Run final forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 90_000 });
  await run.click();
  await expect(challenge.getByRole('alert')).toContainText('NotImplementedError');
  await expect(week).toContainText('No current forecast');
  const solution = `import pandas as pd
from sklearn.linear_model import LinearRegression
features = ["day", "promotion"]
model = LinearRegression()
model.fit(history[features], history["demand"])
predictions = pd.Series(model.predict(future[features]), index=future.index)`;
  await editor.fill(solution);
  await run.click();
  await expect(week).toContainText('Saved run 2', { timeout: 60_000 });
  await expect(week).toContainText('118.0');
  await expect(challenge.getByRole('region', { name: 'Shop playback', exact: true })).toHaveCount(0);
  await challenge.getByLabel('Final stock for 2026-10-26').fill('117');
  await challenge.getByRole('button', { name: 'Commit stock and submit challenge', exact: true }).click();
  const recap = challenge.getByRole('article', { name: 'Challenge 1 results', exact: true });
  const evaluation = recap.getByRole('region', { name: 'Visual evaluation run 2', exact: true });
  await expect(evaluation).toContainText('2026-10-26');
  await expect(evaluation).toContainText('8.00 mugs/day');
  await expect(recap).toContainText('Challenge 1 · submitted run 2');
  const playback = recap.getByRole('region', { name: 'Shop playback', exact: true });
  await playback.getByRole('button', { name: 'Skip to week results', exact: true }).click();
  await expect(playback).toContainText('867 mugs');
  await expect(playback).toContainText('$6,069.00');
  await expect(playback).toContainText('867 sold + 1 unfilled');
  await challenge.getByRole('button', { name: 'Back to practice', exact: true }).click();
  await page.getByRole('button', { name: 'Open final challenge', exact: true }).click();
  for (const label of ['Feature reasoning', 'Evaluation reasoning', 'Stocking reasoning']) await recap.getByLabel(label).fill('Saved run 2, MAE 0 versus 8; one unfilled request and profit 6069.');
  await recap.getByRole('button', { name: 'Complete mission', exact: true }).click();
  await page.reload();
  await expect(recap.getByRole('heading', { name: 'Mission complete: challenge 1', exact: true })).toBeVisible();
  await expect(playback).toContainText('Week complete');
  await expect(playback).toContainText('$6,069.00');
  await expect(recap).toContainText('Saved run 2, MAE 0 versus 8');
  await expect(editor).toHaveValue(solution);
  await expect(challenge.getByRole('button', { name: 'Commit stock and submit challenge', exact: true })).toBeDisabled();
  await challenge.getByRole('button', { name: 'Try a fresh challenge', exact: true }).click();
  await expect(week).toContainText('2026-11-30');
  await expect(week).toContainText('Demand stays hidden until stock is committed');
  await playback.getByRole('button', { name: 'Replay animation', exact: true }).click();
  await expect(playback).toContainText('Customers place orders', { timeout: 10_000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playback.getByRole('button', { name: 'View day 1: 2026-10-26', exact: true }).click();
  await expect(playback).toContainText('Reduced motion is on');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
