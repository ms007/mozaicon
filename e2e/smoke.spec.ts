import { expect, test } from '@playwright/test'

test('app loads with the Mozaicon title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Mozaicon – Browser-based SVG Icon Editor')
})
