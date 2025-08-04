import { test, expect } from '@playwright/test';

test('homepage displays heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SOMCourse');
});
