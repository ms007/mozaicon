import type { ShapeBase } from '@/types/shapes'

export function isSelectable(shape: Pick<ShapeBase, 'visible' | 'locked'>): boolean {
  return shape.visible && !shape.locked
}

// Order: a-only elements in a's insertion order, then b-only in b's.
export function symmetricDifference(a: readonly string[], b: readonly string[]): string[] {
  const setA = new Set(a)
  const setB = new Set(b)
  const result: string[] = []

  for (const id of setA) {
    if (!setB.has(id)) result.push(id)
  }
  for (const id of setB) {
    if (!setA.has(id)) result.push(id)
  }

  return result
}

// Order: a elements in insertion order, then new b elements in insertion order.
export function union(a: readonly string[], b: readonly string[]): string[] {
  const merged = new Set(a)
  for (const id of b) merged.add(id)
  return [...merged]
}
