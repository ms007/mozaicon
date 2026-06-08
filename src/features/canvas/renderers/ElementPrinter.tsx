import type { ShapeElement } from '@/lib/svg/shapeElement'
import { assertNever } from '@/lib/util/assertNever'

export function ElementPrinter({ element }: { element: ShapeElement }) {
  switch (element.tag) {
    case 'rect':
      return <rect {...element.attrs} />
    case 'path':
      return <path {...element.attrs} />
    default:
      return assertNever(element)
  }
}
