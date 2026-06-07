function escapeJsxString(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function jsxAttrName(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

const NUMERIC_VALUE = /^-?(?:\d+\.?\d*|\.\d+)$/

function printJsxAttrs(el: Element): string {
  let attrs = ''
  for (const attr of el.attributes) {
    const name = jsxAttrName(attr.name)
    attrs += NUMERIC_VALUE.test(attr.value)
      ? ` ${name}={${attr.value}}`
      : ` ${name}="${escapeJsxString(attr.value)}"`
  }
  return attrs
}

function printJsxElement(el: Element, indent: string): string {
  const attrs = printJsxAttrs(el)
  if (el.children.length === 0) return `${indent}<${el.tagName}${attrs} />`
  const children = Array.from(el.children)
    .map((c) => printJsxElement(c, `${indent}  `))
    .join('\n')
  return `${indent}<${el.tagName}${attrs}>\n${children}\n${indent}</${el.tagName}>`
}

export function generateTsx(optimizedSvg: string, componentName: string): string {
  const root = new DOMParser().parseFromString(optimizedSvg, 'image/svg+xml').documentElement
  if (root.tagName !== 'svg') throw new Error('generateTsx: input is not a valid SVG document')

  const viewBox = root.getAttribute('viewBox') ?? ''
  const [, , w, h] = viewBox.split(' ')

  const children = Array.from(root.children)
    .map((c) => printJsxElement(c, '      '))
    .join('\n')

  const rootAttrs = [
    'xmlns="http://www.w3.org/2000/svg"',
    `viewBox="${viewBox}"`,
    `width={${w}}`,
    `height={${h}}`,
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
