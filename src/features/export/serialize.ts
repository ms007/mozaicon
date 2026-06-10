import { iconElements, type ShapeElement } from '@/lib/svg/shapeElement'
import type { Icon } from '@/types/shapes'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function xmlAttrName(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

type AttrValue = string | number | undefined

function attrEntries(attrs: ShapeElement['attrs']): [string, AttrValue][] {
  return Object.entries(attrs) as [string, AttrValue][]
}

function printXmlElement(el: ShapeElement): string {
  let attrs = ''
  for (const [name, value] of attrEntries(el.attrs)) {
    if (value === undefined) continue
    const printed = typeof value === 'string' ? escapeAttr(value) : String(value)
    attrs += ` ${xmlAttrName(name)}="${printed}"`
  }
  return `<${el.tag}${attrs}/>`
}

export function serializeIcon(doc: Icon): string {
  const [minX, minY, w, h] = doc.viewBox
  const viewBox = `${String(minX)} ${String(minY)} ${String(w)} ${String(h)}`

  const children = iconElements(doc).map(printXmlElement).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${children}</svg>`
}
