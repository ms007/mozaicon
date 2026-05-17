import { expect, test } from '@playwright/test'

import { activateRectTool, CANVAS_SELECTOR, getBox, SHAPE_RECT_SELECTOR } from './helpers'

test.describe('Drag-to-Draw rect tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
    await activateRectTool(page)
  })

  test('basic drag creates a rectangle', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.move(box.x + 100, box.y + 100)
    await page.mouse.down()
    await page.mouse.move(box.x + 300, box.y + 250, { steps: 5 })
    await page.mouse.up()

    const rects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rects).toHaveCount(1)
  })

  test('click-fallback inserts a default-sized rectangle', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.click(box.x + 200, box.y + 200)

    const rects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rects).toHaveCount(1)
  })

  test('shift constrains to square', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.move(box.x + 100, box.y + 100)
    await page.mouse.down()
    await page.keyboard.down('Shift')
    await page.mouse.move(box.x + 300, box.y + 150, { steps: 5 })
    await page.mouse.up()
    await page.keyboard.up('Shift')

    const rect = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rect).toHaveCount(1)
    const width = await rect.getAttribute('width')
    const height = await rect.getAttribute('height')
    expect(width).toBe(height)
  })

  test('alt anchors from center', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.move(box.x + 256, box.y + 256)
    await page.mouse.down()
    await page.keyboard.down('Alt')
    await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 })
    await page.mouse.up()
    await page.keyboard.up('Alt')

    const rect = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rect).toHaveCount(1)
  })

  test('escape cancels the drag without inserting a shape', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.move(box.x + 100, box.y + 100)
    await page.mouse.down()
    await page.mouse.move(box.x + 300, box.y + 250, { steps: 5 })
    await page.keyboard.press('Escape')
    await page.mouse.up()

    const rects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rects).toHaveCount(0)
  })
})
