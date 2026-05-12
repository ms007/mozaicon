import { expect, type Locator, type Page, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox, SHAPE_RECT_SELECTOR } from './helpers'

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

async function selectAndGetHandle(
  page: Page,
  canvas: Locator,
  box: { x: number; y: number },
  handle: HandlePosition,
) {
  await page.mouse.click(box.x + 150, box.y + 150)
  await expect(canvas.locator('[data-testid="selection-overlay"]')).toBeVisible()
  const h = canvas.locator(`[data-handle-hit="${handle}"]`)
  await expect(h).toBeVisible()
  const hBox = await getBox(h)
  return { cx: hBox.x + hBox.width / 2, cy: hBox.y + hBox.height / 2 }
}

test.describe('Resize gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('multi-resize: draw two rects → Shift-click both → drag corner → both scale → Cmd-Z restores both', async ({
    page,
  }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 50, 50, 150, 150)
    const allRects = canvas.locator(SHAPE_RECT_SELECTOR)
    await expect(allRects).toHaveCount(1)

    await drawRect(page, box, 250, 250, 350, 350)
    await expect(allRects).toHaveCount(2)

    const rect1 = allRects.nth(0)
    const rect2 = allRects.nth(1)

    const orig1 = {
      x: (await rect1.getAttribute('x')) ?? '',
      y: (await rect1.getAttribute('y')) ?? '',
      width: (await rect1.getAttribute('width')) ?? '',
      height: (await rect1.getAttribute('height')) ?? '',
    }
    const orig2 = {
      x: (await rect2.getAttribute('x')) ?? '',
      y: (await rect2.getAttribute('y')) ?? '',
      width: (await rect2.getAttribute('width')) ?? '',
      height: (await rect2.getAttribute('height')) ?? '',
    }

    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(canvas.locator('[data-testid="selection-overlay"]')).toBeVisible()

    await page.keyboard.down('Shift')
    await page.mouse.click(box.x + 300, box.y + 300)
    await page.keyboard.up('Shift')

    const handles = canvas.locator('[data-testid="resize-handles"]')
    await expect(handles).toBeVisible()

    const seHandle = canvas.locator('[data-handle-hit="se"]')
    await expect(seHandle).toBeVisible()
    const handleBox = await getBox(seHandle)

    const hcx = handleBox.x + handleBox.width / 2
    const hcy = handleBox.y + handleBox.height / 2
    await page.mouse.move(hcx, hcy)
    await page.mouse.down()
    await page.mouse.move(hcx + 40, hcy + 40, { steps: 5 })
    await page.mouse.up()

    const new1Width = Number(await rect1.getAttribute('width'))
    const new2Width = Number(await rect2.getAttribute('width'))
    expect(new1Width).toBeGreaterThan(Number(orig1.width))
    expect(new2Width).toBeGreaterThan(Number(orig2.width))

    await page.keyboard.press('Control+z')
    await expect(rect1).toHaveAttribute('x', orig1.x)
    await expect(rect1).toHaveAttribute('y', orig1.y)
    await expect(rect1).toHaveAttribute('width', orig1.width)
    await expect(rect1).toHaveAttribute('height', orig1.height)
    await expect(rect2).toHaveAttribute('x', orig2.x)
    await expect(rect2).toHaveAttribute('y', orig2.y)
    await expect(rect2).toHaveAttribute('width', orig2.width)
    await expect(rect2).toHaveAttribute('height', orig2.height)
  })

  test('draw rect → drag bottom-right corner → bbox grows → release commits → Cmd-Z restores original', async ({
    page,
  }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 100, 100, 200, 200)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const origX = (await rect.getAttribute('x')) ?? ''
    const origY = (await rect.getAttribute('y')) ?? ''
    const origWidth = (await rect.getAttribute('width')) ?? ''
    const origHeight = (await rect.getAttribute('height')) ?? ''

    // Drawing auto-selects, but click again to be explicit about the precondition.
    await page.mouse.click(box.x + 150, box.y + 150)
    await expect(canvas.locator('[data-testid="selection-overlay"]')).toBeVisible()

    const seHandle = canvas.locator('[data-handle-hit="se"]')
    await expect(seHandle).toBeVisible()
    const handleBox = await getBox(seHandle)

    const handleCenterX = handleBox.x + handleBox.width / 2
    const handleCenterY = handleBox.y + handleBox.height / 2
    await page.mouse.move(handleCenterX, handleCenterY)
    await page.mouse.down()
    await page.mouse.move(handleCenterX + 50, handleCenterY + 50, { steps: 5 })
    await page.mouse.up()

    const newWidth = Number(await rect.getAttribute('width'))
    const newHeight = Number(await rect.getAttribute('height'))
    expect(newWidth).toBeGreaterThan(Number(origWidth))
    expect(newHeight).toBeGreaterThan(Number(origHeight))

    await page.keyboard.press('Control+z')
    await expect(rect).toHaveAttribute('x', origX)
    await expect(rect).toHaveAttribute('y', origY)
    await expect(rect).toHaveAttribute('width', origWidth)
    await expect(rect).toHaveAttribute('height', origHeight)
  })

  test('Shift mid-corner-drag locks aspect ratio', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 100, 100, 200, 180)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const origWidth = Number(await rect.getAttribute('width'))
    const origHeight = Number(await rect.getAttribute('height'))
    const origRatio = origWidth / origHeight

    const { cx, cy } = await selectAndGetHandle(page, canvas, box, 'se')

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 30, cy + 5, { steps: 3 })
    await page.keyboard.down('Shift')
    await page.mouse.move(cx + 60, cy + 10, { steps: 3 })
    await page.mouse.up()
    await page.keyboard.up('Shift')

    const newWidth = Number(await rect.getAttribute('width'))
    const newHeight = Number(await rect.getAttribute('height'))
    expect(newWidth / newHeight).toBeCloseTo(origRatio, 1)
    expect(newWidth).toBeGreaterThan(origWidth)
  })

  test('Alt mid-drag anchors at center', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 100, 100, 200, 200)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const origX = Number(await rect.getAttribute('x'))
    const origWidth = Number(await rect.getAttribute('width'))
    const origCx = origX + origWidth / 2

    const { cx, cy } = await selectAndGetHandle(page, canvas, box, 'e')

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.keyboard.down('Alt')
    await page.mouse.move(cx + 40, cy, { steps: 5 })
    await page.mouse.up()
    await page.keyboard.up('Alt')

    const newX = Number(await rect.getAttribute('x'))
    const newWidth = Number(await rect.getAttribute('width'))
    const newCx = newX + newWidth / 2
    expect(newCx).toBeCloseTo(origCx, 0)
    expect(newWidth).toBeGreaterThan(origWidth)
    expect(newX).toBeLessThan(origX)
  })

  test('drag past anchor mirrors the shape', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 100, 100, 200, 200)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const origX = Number(await rect.getAttribute('x'))

    const { cx, cy } = await selectAndGetHandle(page, canvas, box, 'e')

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 200, cy, { steps: 10 })
    await page.mouse.up()

    const newX = Number(await rect.getAttribute('x'))
    expect(newX).toBeLessThan(origX)
  })

  test('Cmd-Z restores after modifier resize in one step', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await drawRect(page, box, 100, 100, 200, 180)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()

    const origX = (await rect.getAttribute('x')) ?? ''
    const origY = (await rect.getAttribute('y')) ?? ''
    const origWidth = (await rect.getAttribute('width')) ?? ''
    const origHeight = (await rect.getAttribute('height')) ?? ''

    const { cx, cy } = await selectAndGetHandle(page, canvas, box, 'se')

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.keyboard.down('Shift')
    await page.keyboard.down('Alt')
    await page.mouse.move(cx + 50, cy + 50, { steps: 5 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await page.keyboard.up('Alt')

    await page.keyboard.press('Control+z')
    await expect(rect).toHaveAttribute('x', origX)
    await expect(rect).toHaveAttribute('y', origY)
    await expect(rect).toHaveAttribute('width', origWidth)
    await expect(rect).toHaveAttribute('height', origHeight)
  })
})
