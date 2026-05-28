import type { Locator, Page } from '@playwright/test'

export const CANVAS_SELECTOR = 'svg[aria-label="Icon canvas"]'

// Selects only shape rects, excluding the chrome/overlay rects that share the
// `<rect>` tag: the PixelGrid covering rect (data-testid="pixel-grid"), the
// SelectionOverlay bbox, the marquee, and marquee highlights.
export const SHAPE_RECT_SELECTOR =
  'rect:not([data-testid="pixel-grid"]):not([data-testid="selection-overlay"]):not([data-testid="marquee-overlay"]):not([data-testid^="marquee-highlight-"])'

export async function getBox(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Canvas bounding box is null')
  return box
}

export function centerOf(box: { x: number; y: number; width: number; height: number }) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export async function clickShapeCenter(page: Page, shape: Locator) {
  const { x, y } = centerOf(await getBox(shape))
  await page.mouse.click(x, y)
}

export async function shiftClickShapeCenter(page: Page, shape: Locator) {
  await page.keyboard.down('Shift')
  await clickShapeCenter(page, shape)
  await page.keyboard.up('Shift')
}

export async function dragBy(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 5 })
  await page.mouse.up()
}

// The rect tool is one-shot and the active tool defaults to null, so any test
// that needs to draw must arm the tool first.
export async function activateRectTool(page: Page) {
  await page.keyboard.press('r')
}

export async function drawRect(
  page: Page,
  box: { x: number; y: number },
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  await activateRectTool(page)
  await page.mouse.move(box.x + x1, box.y + y1)
  await page.mouse.down()
  await page.mouse.move(box.x + x2, box.y + y2, { steps: 5 })
  await page.mouse.up()
}
