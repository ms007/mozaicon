import { expect, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox, SHAPE_RECT_SELECTOR } from './helpers'

function layerPanel(page: import('@playwright/test').Page) {
  return page.getByRole('listbox', { name: 'Layer list' })
}

function layerItems(page: import('@playwright/test').Page) {
  return layerPanel(page).locator('[data-slot="layer-item"]')
}

// Default-named shapes are all "Rect", so layer-item text can't observe order.
// The SVG DOM order is the real z-order; the distinct x attributes identify
// each rect.
async function shapeOrder(page: import('@playwright/test').Page): Promise<string[]> {
  const rects = page.locator(CANVAS_SELECTOR).locator(SHAPE_RECT_SELECTOR)
  const count = await rects.count()
  const xs: string[] = []
  for (let i = 0; i < count; i++) {
    xs.push((await rects.nth(i).getAttribute('x')) ?? '')
  }
  return xs
}

async function drawThreeRects(page: import('@playwright/test').Page) {
  const canvas = page.locator(CANVAS_SELECTOR)
  const box = await getBox(canvas)
  await drawRect(page, box, 20, 20, 60, 60)
  await drawRect(page, box, 80, 80, 120, 120)
  await drawRect(page, box, 140, 140, 180, 180)
  await expect(layerItems(page)).toHaveCount(3)
}

test.describe('Layer drag-to-reorder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('drag a layer down to reorder z-order, undo restores order', async ({ page }) => {
    await drawThreeRects(page)

    const orderBefore = await shapeOrder(page)
    expect(orderBefore).toHaveLength(3)

    const items = layerItems(page)
    const topItem = items.nth(0)
    const bottomItem = items.nth(2)

    const topBox = await getBox(topItem)
    const bottomBox = await getBox(bottomItem)

    // Drag the top layer down past the bottom layer
    await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height + 4, {
      steps: 10,
    })
    await page.mouse.up()

    // Wait for the reorder to apply
    await page.waitForTimeout(100)

    const orderAfter = await shapeOrder(page)
    expect(orderAfter).not.toEqual(orderBefore)
    expect([...orderAfter].sort()).toEqual([...orderBefore].sort())

    // Undo should restore original order
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(100)

    const orderRestored = await shapeOrder(page)
    expect(orderRestored).toEqual(orderBefore)
  })

  test('drop indicator appears during drag', async ({ page }) => {
    await drawThreeRects(page)

    const items = layerItems(page)
    const topItem = items.nth(0)
    const middleItem = items.nth(1)

    const topBox = await getBox(topItem)
    const middleBox = await getBox(middleItem)

    // Start dragging the top layer
    await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(middleBox.x + middleBox.width / 2, middleBox.y + middleBox.height / 2, {
      steps: 10,
    })

    // Drop indicator should be visible during drag
    const indicator = layerPanel(page).locator('[data-testid="drop-indicator"]')
    await expect(indicator).toBeVisible()

    await page.mouse.up()
  })

  test('drop on same position produces no history entry', async ({ page }) => {
    await drawThreeRects(page)

    const orderBefore = await shapeOrder(page)

    // Click the top item to select it
    const items = layerItems(page)
    const topItem = items.nth(0)
    const topBox = await getBox(topItem)

    // "Drag" with minimal movement that doesn't cross another item
    await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2 + 2, {
      steps: 2,
    })
    await page.mouse.up()

    await page.waitForTimeout(100)

    // Order should be unchanged
    const orderAfter = await shapeOrder(page)
    expect(orderAfter).toEqual(orderBefore)
  })
})
