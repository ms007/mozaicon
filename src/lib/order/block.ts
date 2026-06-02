import type { Shape } from '@/types/shapes'

export type ReorderResult = {
  shapes: Shape[]
  changed: boolean
}

function buildMovingBlock(
  shapes: Shape[],
  operatingIds: Set<string>,
  lockedIds: Set<string>,
): Shape[] {
  const block: Shape[] = []
  for (const s of shapes) {
    if (operatingIds.has(s.id) && !lockedIds.has(s.id)) {
      block.push(s)
    }
  }
  return block
}

function getLockedIds(shapes: Shape[], ids: Set<string>): Set<string> {
  const locked = new Set<string>()
  for (const s of shapes) {
    if (ids.has(s.id) && s.locked) locked.add(s.id)
  }
  return locked
}

/**
 * Insert a contiguous block of shapes before `beforeId`.
 * If `beforeId` is `null`, append to the end (= front / top of z-order).
 *
 * The block preserves its members' relative order from the original array.
 * Locked shapes in the operating set are filtered out and stay in place.
 */
export function moveBlockBefore(
  shapes: Shape[],
  ids: string[],
  beforeId: string | null,
): ReorderResult {
  if (ids.length === 0) return { shapes, changed: false }

  const operatingIds = new Set(ids)
  const lockedIds = getLockedIds(shapes, operatingIds)

  const block = buildMovingBlock(shapes, operatingIds, lockedIds)
  if (block.length === 0) return { shapes, changed: false }

  const movingIds = new Set(block.map((s) => s.id))
  const rest = shapes.filter((s) => !movingIds.has(s.id))

  let result: Shape[]
  if (beforeId === null) {
    result = [...rest, ...block]
  } else {
    const insertIdx = rest.findIndex((s) => s.id === beforeId)
    if (insertIdx === -1) {
      result = [...rest, ...block]
    } else {
      result = [...rest.slice(0, insertIdx), ...block, ...rest.slice(insertIdx)]
    }
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i] !== shapes[i]) return { shapes: result, changed: true }
  }
  return { shapes, changed: false }
}

export function bringToFront(shapes: Shape[], ids: string[]): ReorderResult {
  return moveBlockBefore(shapes, ids, null)
}

export function sendToBack(shapes: Shape[], ids: string[]): ReorderResult {
  if (ids.length === 0) return { shapes, changed: false }

  const operatingIds = new Set(ids)
  const lockedIds = getLockedIds(shapes, operatingIds)

  const block = buildMovingBlock(shapes, operatingIds, lockedIds)
  if (block.length === 0) return { shapes, changed: false }

  const movingIds = new Set(block.map((s) => s.id))

  // Find the first non-moving shape to insert before
  let beforeId: string | null = null
  for (const s of shapes) {
    if (!movingIds.has(s.id)) {
      beforeId = s.id
      break
    }
  }

  if (beforeId === null) {
    // All shapes are in the moving block — nothing to reorder around
    return { shapes, changed: false }
  }

  return moveBlockBefore(shapes, ids, beforeId)
}
