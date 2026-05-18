import { expect, test } from '@playwright/test'

import {
  CANVAS_SELECTOR,
  centerOf,
  clickShapeCenter,
  dragBy,
  drawRect,
  getBox,
  SHAPE_RECT_SELECTOR,
  shiftClickShapeCenter,
} from './helpers'

const HANDLE_COUNT = 8 // 4 corners + 4 edges

test.describe('Drag-to-Move gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('single rect drag moves it, undo restores', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const xBefore = Number(await rect.getAttribute('x'))
    const yBefore = Number(await rect.getAttribute('y'))

    await dragBy(page, centerOf(await getBox(rect)), 30, 20)

    const xAfter = Number(await rect.getAttribute('x'))
    const yAfter = Number(await rect.getAttribute('y'))

    expect(xAfter).toBeGreaterThan(xBefore)
    expect(yAfter).toBeGreaterThan(yBefore)

    await page.keyboard.press('Control+z')

    const xRestored = Number(await rect.getAttribute('x'))
    const yRestored = Number(await rect.getAttribute('y'))
    expect(xRestored).toBeCloseTo(xBefore, 0)
    expect(yRestored).toBeCloseTo(yBefore, 0)
  })

  test('shows cursor-move during drag and reverts on release', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const { x: cx, y: cy } = centerOf(await getBox(rect))
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 30, cy + 20, { steps: 5 })

    await expect(canvas).toHaveClass(/cursor-move/)

    await page.mouse.up()

    await expect(canvas).not.toHaveClass(/cursor-move/)
  })

  test('selection bbox and resize handles stay visible during drag', async ({ page }) => {
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

    const overlay = canvas.locator('[data-testid="selection-overlay"]')
    const handles = canvas.locator('[data-testid="resize-handles"]')
    const handleDots = handles.locator('[data-handle]')
    await expect(overlay).toBeVisible()
    await expect(handles).toBeVisible()
    expect(await handleDots.count()).toBe(HANDLE_COUNT)

    const start = centerOf(await getBox(rect1))
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(start.x + 40, start.y + 30, { steps: 5 })

    await expect(overlay).toBeVisible()
    await expect(handles).toBeVisible()
    expect(await handleDots.count()).toBe(HANDLE_COUNT)

    await page.mouse.up()

    await expect(overlay).toBeVisible()
    await expect(handles).toBeVisible()
  })

  test('multi-select drag moves both rects, undo restores both', async ({ page }) => {
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

    await dragBy(page, centerOf(await getBox(rect1)), 40, 30)

    const x1After = Number(await rect1.getAttribute('x'))
    const y1After = Number(await rect1.getAttribute('y'))
    const x2After = Number(await rect2.getAttribute('x'))
    const y2After = Number(await rect2.getAttribute('y'))

    expect(x1After).toBeGreaterThan(x1Before)
    expect(y1After).toBeGreaterThan(y1Before)
    expect(x2After).toBeGreaterThan(x2Before)
    expect(y2After).toBeGreaterThan(y2Before)

    await page.keyboard.press('Control+z')

    const x1Restored = Number(await rect1.getAttribute('x'))
    const y1Restored = Number(await rect1.getAttribute('y'))
    const x2Restored = Number(await rect2.getAttribute('x'))
    const y2Restored = Number(await rect2.getAttribute('y'))

    expect(x1Restored).toBeCloseTo(x1Before, 0)
    expect(y1Restored).toBeCloseTo(y1Before, 0)
    expect(x2Restored).toBeCloseTo(x2Before, 0)
    expect(y2Restored).toBeCloseTo(y2Before, 0)
  })
})
