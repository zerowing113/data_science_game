import { expect, test } from '@playwright/test';

test('a fresh browser runs bundled Python without external requests and can stop the local game', async ({ page, context }) => {
  const external: string[] = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    external.push(url.href);
    return route.abort();
  });
  await page.goto('/');
  await page.getByLabel('Your prediction').fill('Planned promotions should explain the sale days while offline.');
  await page.getByRole('radio', { name: /Trend \+ promotions/ }).check();
  const run = page.getByRole('button', { name: 'Run forecast', exact: true });
  await expect(run).toBeEnabled({ timeout: 90_000 });
  await run.click();
  await expect(page.getByRole('table', { name: /Daily forecast/ })).toContainText('96.0');
  expect(external).toEqual([]);
  await page.getByRole('button', { name: 'Stop game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep playing' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep playing' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  await expect(page.getByRole('button', { name: 'Stop game', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Stop game', exact: true }).click();
  await page.getByRole('button', { name: 'Stop and close session', exact: true }).click();
  await expect(page.getByText('Game stopped. You can close this tab.', { exact: true })).toBeVisible();
});
