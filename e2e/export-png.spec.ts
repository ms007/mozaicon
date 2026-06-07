import fs from 'node:fs'

import { expect, test } from '@playwright/test'

import { activateRectTool, CANVAS_SELECTOR, drawRect, getBox } from './helpers'

test.describe('Export PNG download', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible()
  })

  test('downloads a PNG file at 2x with correct filename and valid content', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    await drawRect(page, box, 100, 100, 300, 250)

    const downloadPromise = page.waitForEvent('download')
    await page.click('button[aria-label="Export 2x"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('untitled@2x.png')

    const filePath = await download.path()
    expect(filePath).toBeTruthy()
    const content = fs.readFileSync(filePath)
    expect(content.length).toBeGreaterThan(0)
    expect(content[0]).toBe(0x89)
    expect(content[1]).toBe(0x50)
    expect(content[2]).toBe(0x4e)
    expect(content[3]).toBe(0x47)
  })

  test('1x PNG has no scale suffix in filename', async ({ page }) => {
    await activateRectTool(page)
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)

    await page.mouse.click(box.x + 200, box.y + 200)

    const downloadPromise = page.waitForEvent('download')
    await page.click('button[aria-label="Export 1x"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('untitled.png')
  })

  test('PNG buttons are enabled after drawing a shape', async ({ page }) => {
    const btn1x = page.locator('button[aria-label="Export 1x"]')
    const btn2x = page.locator('button[aria-label="Export 2x"]')
    const btn4x = page.locator('button[aria-label="Export 4x"]')

    await expect(btn1x).toBeDisabled()
    await expect(btn2x).toBeDisabled()
    await expect(btn4x).toBeDisabled()

    await activateRectTool(page)
    const canvas = page.locator(CANVAS_SELECTOR)
    const box = await getBox(canvas)
    await page.mouse.click(box.x + 200, box.y + 200)

    await expect(btn1x).toBeEnabled()
    await expect(btn2x).toBeEnabled()
    await expect(btn4x).toBeEnabled()
  })
})
