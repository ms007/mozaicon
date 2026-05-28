import { expect, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox, SHAPE_RECT_SELECTOR } from './helpers'

test.describe('Click-to-select & Shift-click multi-select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('draw rect → click rect (selected) → click empty (deselects) → shift-click second (both selected)', async ({
    page,
  }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    await drawRect(page, box, 50, 50, 150, 150)
    await expect(canvas.locator(SHAPE_RECT_SELECTOR).first()).toBeVisible()

    await drawRect(page, box, 300, 300, 400, 400)

    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)

    await page.mouse.click(box.x + 480, box.y + 480)
    await expect(overlay).toHaveCount(0)

    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)
    const singleWidth = Number(await overlay.getAttribute('width'))

    await page.keyboard.down('Shift')
    await page.mouse.click(box.x + 350, box.y + 350)
    await page.keyboard.up('Shift')
    await expect(overlay).toHaveCount(1)

    const multiWidth = Number(await overlay.getAttribute('width'))
    expect(multiWidth).toBeGreaterThan(singleWidth)
  })
})
