import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const htmlPath = resolve(here, 'og-card.html')
const outPath = resolve(here, '../../public/og-image.png')

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

console.log(`Wrote ${outPath}`)
