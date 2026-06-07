import { toKebabSlug, toPascalComponentName } from '@/lib/naming'
import { assertNever } from '@/lib/util/assertNever'
import type { ExportTarget } from '@/store/atoms/export'
import type { Document } from '@/types/shapes'

import { downloadBlob, downloadSvg, downloadTsx } from './download'
import { exportSvg, exportTsx } from './pipeline'
import { rasterize } from './rasterize'

const PNG_SCALES = { png1x: 1, png2x: 2, png4x: 4 } as const

function pngFilename(slug: string, scale: number): string {
  if (scale === 1) return `${slug}.png`
  return `${slug}@${String(scale)}x.png`
}

export async function performExport(doc: Document, target: ExportTarget): Promise<void> {
  try {
    switch (target) {
      case 'svg': {
        const svg = await exportSvg(doc)
        downloadSvg(svg, `${toKebabSlug(doc.name)}.svg`)
        return
      }
      case 'tsx': {
        const componentName = toPascalComponentName(doc.name)
        downloadTsx(await exportTsx(doc, componentName), `${componentName}.tsx`)
        return
      }
      case 'png1x':
      case 'png2x':
      case 'png4x': {
        const scale = PNG_SCALES[target]
        const svg = await exportSvg(doc)
        const blob = await rasterize({ svgString: svg, viewBox: doc.viewBox, scale })
        downloadBlob(blob, pngFilename(toKebabSlug(doc.name), scale))
        return
      }
      default:
        assertNever(target)
    }
  } catch (err) {
    console.error('Export failed:', err)
  }
}
