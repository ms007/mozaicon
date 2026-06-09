import type { Radii } from '@/types/shapes'

import { clampRadii } from './corner-radius'

function S(n: number): string {
  return String(Math.round(n * 1e4) / 1e4)
}

/**
 * Single entry point for rect corner geometry.
 *
 * smoothing 0 → arc-based rounded corners.
 * smoothing 1–100 → cubic Bézier approximation of a superellipse.
 * Radii clamped to half the smaller side; smoothing clamped to 0–100.
 */
export function cornerPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: Radii,
  smoothing: number,
): string {
  const clamped = clampRadii(radii, width, height)
  const [tl, tr, br, bl] = clamped
  const sm = Math.max(0, Math.min(smoothing, 100))

  if (tl === 0 && tr === 0 && br === 0 && bl === 0) {
    return 'M' + S(x) + ' ' + S(y) + 'H' + S(x + width) + 'V' + S(y + height) + 'H' + S(x) + 'Z'
  }

  if (sm === 0) {
    return arcPath(x, y, width, height, tl, tr, br, bl)
  }

  return smoothPath(x, y, width, height, tl, tr, br, bl, sm / 100)
}

function arcPath(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
): string {
  const parts: string[] = []

  parts.push('M' + S(x + tl) + ' ' + S(y))

  parts.push('H' + S(x + w - tr))
  if (tr > 0) parts.push('A' + S(tr) + ' ' + S(tr) + ' 0 0 1 ' + S(x + w) + ' ' + S(y + tr))

  parts.push('V' + S(y + h - br))
  if (br > 0) parts.push('A' + S(br) + ' ' + S(br) + ' 0 0 1 ' + S(x + w - br) + ' ' + S(y + h))

  parts.push('H' + S(x + bl))
  if (bl > 0) parts.push('A' + S(bl) + ' ' + S(bl) + ' 0 0 1 ' + S(x) + ' ' + S(y + h - bl))

  parts.push('V' + S(y + tl))
  if (tl > 0) parts.push('A' + S(tl) + ' ' + S(tl) + ' 0 0 1 ' + S(x + tl) + ' ' + S(y))

  parts.push('Z')

  return parts.join('')
}

// Circular-arc magic number: (4/3)(√2 − 1) ≈ 0.5523
const ARC_K = (4 / 3) * (Math.SQRT2 - 1)

function smoothPath(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
  t: number, // normalized 0–1
): string {
  const parts: string[] = []

  // For each corner we emit a cubic Bézier from the tangent point on one
  // edge to the tangent point on the adjacent edge. The control points are
  // placed along the edges at distance k*r from the tangent points toward
  // the sharp corner vertex. k interpolates from the circular-arc magic
  // number (≈ 0.5523) at t=0 to 1.0 at t=1. At k=1 both control points
  // sit at the sharp corner vertex, so the Bézier hugs the edges and makes
  // a near-right-angle turn — the classic squircle/iOS shape.

  parts.push('M' + S(x + tl) + ' ' + S(y))

  // Top edge → Top-right corner (vertex at x+w, y)
  parts.push('L' + S(x + w - tr) + ' ' + S(y))
  if (tr > 0) {
    pushCorner(parts, x + w - tr, y, x + w, y + tr, x + w, y, t)
  }

  // Right edge → Bottom-right corner (vertex at x+w, y+h)
  parts.push('L' + S(x + w) + ' ' + S(y + h - br))
  if (br > 0) {
    pushCorner(parts, x + w, y + h - br, x + w - br, y + h, x + w, y + h, t)
  }

  // Bottom edge → Bottom-left corner (vertex at x, y+h)
  parts.push('L' + S(x + bl) + ' ' + S(y + h))
  if (bl > 0) {
    pushCorner(parts, x + bl, y + h, x, y + h - bl, x, y + h, t)
  }

  // Left edge → Top-left corner (vertex at x, y)
  parts.push('L' + S(x) + ' ' + S(y + tl))
  if (tl > 0) {
    pushCorner(parts, x, y + tl, x + tl, y, x, y, t)
  }

  parts.push('Z')

  return parts.join('')
}

function pushCorner(
  parts: string[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  t: number,
): void {
  const k = ARC_K + t * (1 - ARC_K)

  // CP1: from start tangent point, fraction k toward the corner vertex
  const cp1x = x0 + (cx - x0) * k
  const cp1y = y0 + (cy - y0) * k

  // CP2: from end tangent point, fraction k toward the corner vertex
  const cp2x = x1 + (cx - x1) * k
  const cp2y = y1 + (cy - y1) * k

  parts.push(
    'C' + S(cp1x) + ' ' + S(cp1y) + ' ' + S(cp2x) + ' ' + S(cp2y) + ' ' + S(x1) + ' ' + S(y1),
  )
}
