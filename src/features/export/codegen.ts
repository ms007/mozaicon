import { documentElements, type ShapeElement } from '@/lib/svg/shapeElement'
import type { Document } from '@/types/shapes'

function escapeJsxString(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function printJsxElement(el: ShapeElement): string {
  let attrs = ''
  for (const [name, value] of Object.entries(el.attrs)) {
    if (value === undefined) continue
    attrs +=
      typeof value === 'number'
        ? ` ${name}={${String(value)}}`
        : ` ${name}="${escapeJsxString(value)}"`
  }
  return `      <${el.tag}${attrs} />`
}

export function generateTsx(doc: Document, componentName: string): string {
  const [minX, minY, w, h] = doc.viewBox

  const children = documentElements(doc).map(printJsxElement).join('\n')

  const rootAttrs = [
    'xmlns="http://www.w3.org/2000/svg"',
    `viewBox="${String(minX)} ${String(minY)} ${String(w)} ${String(h)}"`,
    `width={${String(w)}}`,
    `height={${String(h)}}`,
    '{...props}',
  ]

  let svgElement: string
  if (children) {
    svgElement = `    <svg ${rootAttrs.join(' ')}>\n${children}\n    </svg>`
  } else {
    svgElement = `    <svg\n${rootAttrs.map((a) => `      ${a}`).join('\n')}\n    ></svg>`
  }

  return `import type { SVGProps } from 'react'

export function ${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
${svgElement}
  )
}
`
}
