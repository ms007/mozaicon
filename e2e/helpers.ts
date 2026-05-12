import type { Locator, Page } from '@playwright/test'

export const CANVAS_SELECTOR = 'svg[aria-label="Icon canvas"]'

// Selects only shape rects, excluding the SelectionOverlay's bbox rect — which
// shares the `<rect>` tag but carries `data-testid="selection-overlay"`.
export const SHAPE_RECT_SELECTOR = 'rect:not([data-testid="selection-overlay"])'

export async function getBox(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Canvas bounding box is null')
  return box
}

export async function drawRect(
  page: Page,
  box: { x: number; y: number },
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  await page.mouse.move(box.x + x1, box.y + y1)
  await page.mouse.down()
  await page.mouse.move(box.x + x2, box.y + y2, { steps: 5 })
  await page.mouse.up()
}
