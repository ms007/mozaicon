import { expect, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox, SHAPE_RECT_SELECTOR } from './helpers'

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

    const rectBox = await getBox(rect)
    const cx = rectBox.x + rectBox.width / 2
    const cy = rectBox.y + rectBox.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 30, cy + 20, { steps: 5 })
    await page.mouse.up()

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

  test('multi-select drag moves both rects, undo restores both', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 100, 100)
    await drawRect(page, box, 200, 200, 250, 250)

    const rects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(rects).toHaveCount(2)

    const rect1 = rects.nth(0)
    const rect2 = rects.nth(1)

    const rect1Box = await getBox(rect1)
    await page.mouse.click(rect1Box.x + rect1Box.width / 2, rect1Box.y + rect1Box.height / 2)

    await page.keyboard.down('Shift')
    const rect2Box = await getBox(rect2)
    await page.mouse.click(rect2Box.x + rect2Box.width / 2, rect2Box.y + rect2Box.height / 2)
    await page.keyboard.up('Shift')

    const x1Before = Number(await rect1.getAttribute('x'))
    const y1Before = Number(await rect1.getAttribute('y'))
    const x2Before = Number(await rect2.getAttribute('x'))
    const y2Before = Number(await rect2.getAttribute('y'))

    const r1 = await getBox(rect1)
    const startX = r1.x + r1.width / 2
    const startY = r1.y + r1.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 40, startY + 30, { steps: 5 })
    await page.mouse.up()

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
