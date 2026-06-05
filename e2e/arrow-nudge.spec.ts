import { expect, test } from '@playwright/test'

import {
  CANVAS_SELECTOR,
  clickShapeCenter,
  drawRect,
  getBox,
  SHAPE_RECT_SELECTOR,
  shiftClickShapeCenter,
} from './helpers'

test.describe('Arrow-key nudging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('plain arrow key moves shape by 1 unit', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()
    await clickShapeCenter(page, rect)

    const xBefore = Number(await rect.getAttribute('x'))
    const yBefore = Number(await rect.getAttribute('y'))

    await page.keyboard.down('ArrowRight')
    await page.keyboard.up('ArrowRight')

    const xAfter = Number(await rect.getAttribute('x'))
    const yAfter = Number(await rect.getAttribute('y'))

    expect(xAfter).toBeCloseTo(xBefore + 1, 1)
    expect(yAfter).toBeCloseTo(yBefore, 1)
  })

  test('Shift+arrow moves shape by 10 units', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()
    await clickShapeCenter(page, rect)

    const xBefore = Number(await rect.getAttribute('x'))

    await page.keyboard.down('Shift')
    await page.keyboard.down('ArrowRight')
    await page.keyboard.up('ArrowRight')
    await page.keyboard.up('Shift')

    const xAfter = Number(await rect.getAttribute('x'))
    expect(xAfter).toBeCloseTo(xBefore + 10, 1)
  })

  test('Alt+arrow moves shape by 0.1 units', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()
    await clickShapeCenter(page, rect)

    const xBefore = Number(await rect.getAttribute('x'))

    await page.keyboard.down('Alt')
    await page.keyboard.down('ArrowRight')
    await page.keyboard.up('ArrowRight')
    await page.keyboard.up('Alt')

    const xAfter = Number(await rect.getAttribute('x'))
    expect(xAfter).toBeCloseTo(xBefore + 0.1, 2)
  })

  test('one undo reverses an entire nudge run', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()
    await clickShapeCenter(page, rect)

    const xBefore = Number(await rect.getAttribute('x'))
    const yBefore = Number(await rect.getAttribute('y'))

    // Hold ArrowRight, then also press ArrowDown while Right is still held.
    // Both keys in the same run → one history entry on release.
    await page.keyboard.down('ArrowRight')
    await page.keyboard.down('ArrowDown')
    await page.keyboard.up('ArrowDown')
    await page.keyboard.up('ArrowRight')

    const xAfter = Number(await rect.getAttribute('x'))
    const yAfter = Number(await rect.getAttribute('y'))
    expect(xAfter).toBeCloseTo(xBefore + 1, 1)
    expect(yAfter).toBeCloseTo(yBefore + 1, 1)

    // Single Ctrl+Z undoes the entire run
    await page.keyboard.press('Control+z')

    const xRestored = Number(await rect.getAttribute('x'))
    const yRestored = Number(await rect.getAttribute('y'))
    expect(xRestored).toBeCloseTo(xBefore, 1)
    expect(yRestored).toBeCloseTo(yBefore, 1)
  })

  test('multi-select nudge moves all shapes together', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 100, 100)
    await drawRect(page, box, 200, 200, 250, 250)

    const rects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rects).toHaveCount(2)

    const rect1 = rects.nth(0)
    const rect2 = rects.nth(1)

    await clickShapeCenter(page, rect1)
    await shiftClickShapeCenter(page, rect2)

    const x1Before = Number(await rect1.getAttribute('x'))
    const y1Before = Number(await rect1.getAttribute('y'))
    const x2Before = Number(await rect2.getAttribute('x'))
    const y2Before = Number(await rect2.getAttribute('y'))

    await page.keyboard.down('ArrowRight')
    await page.keyboard.up('ArrowRight')

    const x1After = Number(await rect1.getAttribute('x'))
    const y1After = Number(await rect1.getAttribute('y'))
    const x2After = Number(await rect2.getAttribute('x'))
    const y2After = Number(await rect2.getAttribute('y'))

    expect(x1After).toBeCloseTo(x1Before + 1, 1)
    expect(y1After).toBeCloseTo(y1Before, 1)
    expect(x2After).toBeCloseTo(x2Before + 1, 1)
    expect(y2After).toBeCloseTo(y2Before, 1)
  })
})
