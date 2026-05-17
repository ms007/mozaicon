import { expect, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox } from './helpers'

test.describe('Marquee selection (drag-to-select)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  async function setupTwoRects(page: import('@playwright/test').Page) {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    await drawRect(page, box, 50, 50, 150, 150)
    await drawRect(page, box, 250, 250, 350, 350)
    // Deselect after drawing
    await page.mouse.click(box.x + 480, box.y + 480)
    return { canvas, box }
  }

  test('drag across shapes selects them', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Marquee drag that covers both rects
    await page.mouse.move(box.x + 20, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 })
    await page.mouse.up()

    await expect(overlay).toHaveCount(1)
  })

  test('Shift+drag toggles overlap', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Select first rect by clicking
    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)
    const firstWidth = Number(await overlay.getAttribute('width'))

    // Shift+marquee covering second rect only
    await page.keyboard.down('Shift')
    await page.mouse.move(box.x + 220, box.y + 220)
    await page.mouse.down()
    await page.mouse.move(box.x + 380, box.y + 380, { steps: 10 })
    await page.mouse.up()
    await page.keyboard.up('Shift')

    // Both should be selected now
    await expect(overlay).toHaveCount(1)
    const bothWidth = Number(await overlay.getAttribute('width'))
    expect(bothWidth).toBeGreaterThan(firstWidth)
  })

  test('sub-threshold click on background clears selection', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Select a rect
    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)

    // Click empty area (sub-threshold) — clears
    await page.mouse.click(box.x + 480, box.y + 480)
    await expect(overlay).toHaveCount(0)
  })

  test('Shift+click on background preserves selection', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Select a rect
    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)

    // Shift+click empty area — preserves
    await page.keyboard.down('Shift')
    await page.mouse.click(box.x + 480, box.y + 480)
    await page.keyboard.up('Shift')
    await expect(overlay).toHaveCount(1)
  })

  test('Escape mid-drag leaves selection intact', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Select first rect
    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)

    // Start marquee drag, then Escape
    await page.mouse.move(box.x + 20, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 5 })
    await page.keyboard.press('Escape')
    await page.mouse.up()

    // Original selection preserved
    await expect(overlay).toHaveCount(1)
  })

  test('one Undo after marquee commit restores prior selection', async ({ page }) => {
    const { canvas, box } = await setupTwoRects(page)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    // Select first rect
    await page.mouse.click(box.x + 100, box.y + 100)
    await expect(overlay).toHaveCount(1)

    // Marquee drag to select both
    await page.mouse.move(box.x + 20, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 })
    await page.mouse.up()

    await expect(overlay).toHaveCount(1)
    const bothWidth = Number(await overlay.getAttribute('width'))

    // Undo
    await page.keyboard.press('Control+z')
    await expect(overlay).toHaveCount(1)
    const afterUndoWidth = Number(await overlay.getAttribute('width'))

    // After undo, should go back to single rect selection (smaller bbox)
    expect(afterUndoWidth).toBeLessThan(bothWidth)
  })
})
