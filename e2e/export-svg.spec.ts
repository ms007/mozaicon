import fs from 'node:fs'

import { expect, test } from '@playwright/test'

import { activateRectTool, CANVAS_SELECTOR, drawRect, getBox } from './helpers'

test.describe('Export SVG download', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('downloads an SVG file with correct filename and content', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    await drawRect(page, box, 100, 100, 300, 250)

    const downloadPromise = page.waitForEvent('download')
    await page.click('button[aria-label="Export SVG"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('untitled.svg')

    const filePath = await download.path()
    expect(filePath).toBeTruthy()
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('<svg')
    expect(content).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(content).toContain('<rect')
  })

  test('all export buttons are disabled when no shapes exist', async ({ page }) => {
    const svgBtn = page.locator('button[aria-label="Export SVG"]')
    await expect(svgBtn).toBeDisabled()

    const tsxBtn = page.locator('button[aria-label="Export TSX"]')
    await expect(tsxBtn).toBeDisabled()
  })

  test('SVG button becomes enabled after drawing a shape', async ({ page }) => {
    const svgBtn = page.locator('button[aria-label="Export SVG"]')
    await expect(svgBtn).toBeDisabled()

    await activateRectTool(page)
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    await page.mouse.click(box.x + 200, box.y + 200)

    await expect(svgBtn).toBeEnabled()
  })
})
