import type { Radii, RectShape } from '@/types/shapes'

export function effectiveRadii(shape: RectShape): Radii {
  if (shape.radii) return shape.radii
  const r = shape.rx ?? 0
  return [r, r, r, r]
}

export function clampRadii(radii: Radii, width: number, height: number): Radii {
  const max = Math.min(width, height) / 2
  return [
    Math.max(0, Math.min(radii[0], max)),
    Math.max(0, Math.min(radii[1], max)),
    Math.max(0, Math.min(radii[2], max)),
    Math.max(0, Math.min(radii[3], max)),
  ]
}

export function isUniform(radii: Radii): boolean {
  return radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3]
}

function S(n: number): string {
  return String(n)
}

export function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: Radii,
): string {
  const [tl, tr, br, bl] = clampRadii(radii, width, height)

  if (tl === 0 && tr === 0 && br === 0 && bl === 0) {
    return 'M' + S(x) + ' ' + S(y) + 'H' + S(x + width) + 'V' + S(y + height) + 'H' + S(x) + 'Z'
  }

  const parts: string[] = []

  parts.push('M' + S(x + tl) + ' ' + S(y))

  parts.push('H' + S(x + width - tr))
  if (tr > 0) parts.push('A' + S(tr) + ' ' + S(tr) + ' 0 0 1 ' + S(x + width) + ' ' + S(y + tr))

  parts.push('V' + S(y + height - br))
  if (br > 0)
    parts.push('A' + S(br) + ' ' + S(br) + ' 0 0 1 ' + S(x + width - br) + ' ' + S(y + height))

  parts.push('H' + S(x + bl))
  if (bl > 0) parts.push('A' + S(bl) + ' ' + S(bl) + ' 0 0 1 ' + S(x) + ' ' + S(y + height - bl))

  parts.push('V' + S(y + tl))
  if (tl > 0) parts.push('A' + S(tl) + ' ' + S(tl) + ' 0 0 1 ' + S(x + tl) + ' ' + S(y))

  parts.push('Z')

  return parts.join('')
}
