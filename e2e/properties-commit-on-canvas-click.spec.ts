import { expect, test } from '@playwright/test'

import { CANVAS_SELECTOR, drawRect, getBox, SHAPE_RECT_SELECTOR } from './helpers'

// Regression: a background pointerdown arms a marquee before the focused
// properties field blurs. The marquee must not block the blur-commit, otherwise
// the arrow-key nudge is silently dropped when clicking onto empty canvas.
test.describe('Properties field commits on canvas click', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('arrow-nudge W → click empty canvas → nudge is committed and selection clears', async ({
    page,
  }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    const overlay = canvas.locator('[data-testid="selection-overlay"]')

    await drawRect(page, box, 50, 50, 150, 150)
    const rect = canvas.locator(SHAPE_RECT_SELECTOR).first()
    await expect(rect).toBeVisible()
    await expect(overlay).toHaveCount(1)

    const widthField = page.getByRole('textbox', { name: 'W' })
    await widthField.click()
    const before = Number(await widthField.inputValue())

    await widthField.press('ArrowUp')
    await expect(widthField).toHaveValue(String(before + 1))

    // Background click: arms a marquee on pointerdown, blurs the field. The
    // commit must survive the marquee; selection clears via the same click.
    await page.mouse.click(box.x + 480, box.y + 480)

    await expect(overlay).toHaveCount(0)
    // Deselected → the rect now renders from the committed document, not the
    // (now-cleared) preview draft. Width staying at before+1 proves the commit.
    expect(Number(await rect.getAttribute('width'))).toBeCloseTo(before + 1, 5)
  })
})
