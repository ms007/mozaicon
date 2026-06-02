import type { Shape } from '@/types/shapes'

export type NudgeDirection = 'forward' | 'backward'

export interface NudgeResult {
  shapes: Shape[]
  changed: boolean
}

/**
 * Per-neighbor z-order nudge. Each selected shape moves one step relative to
 * its nearest unselected neighbor in the given direction. Locked shapes are
 * fixed anchors and never move, even if selected. Hidden shapes are reorderable.
 *
 * Returns the reordered shapes array and a `changed` flag (false when every
 * selected shape is already at its boundary — callers use this for the no-op guard).
 */
export function nudge(
  shapes: readonly Shape[],
  selectedIds: string[],
  direction: NudgeDirection,
): NudgeResult {
  if (shapes.length === 0 || selectedIds.length === 0) {
    return { shapes: shapes as Shape[], changed: false }
  }

  const selectedSet = new Set(selectedIds)
  const movable = (id: string, shape: Shape) => selectedSet.has(id) && !shape.locked

  const result = [...shapes]

  if (direction === 'forward') {
    // Walk from high index to low. Each movable shape swaps with the next
    // unselected neighbor above it (higher index = closer to front).
    for (let i = result.length - 1; i >= 0; i--) {
      const shape = result[i]
      if (!movable(shape.id, shape)) continue

      // Find the nearest unselected neighbor above (higher index).
      // Stop early if a locked selected shape is in the way — it's a fixed anchor.
      let target = i + 1
      while (target < result.length && selectedSet.has(result[target].id)) {
        if (result[target].locked) break
        target++
      }

      if (target >= result.length) continue // already frontmost among unselected
      if (result[target].locked) continue // locked neighbor acts as anchor

      // Swap with the unselected neighbor
      const tmp = result[target]
      result[target] = result[i]
      result[i] = tmp
    }
  } else {
    // Walk from low index to high. Each movable shape swaps with the next
    // unselected neighbor below it (lower index = closer to back).
    for (let i = 0; i < result.length; i++) {
      const shape = result[i]
      if (!movable(shape.id, shape)) continue

      let target = i - 1
      while (target >= 0 && selectedSet.has(result[target].id)) {
        if (result[target].locked) break
        target--
      }

      if (target < 0) continue // already backmost among unselected
      if (result[target].locked) continue // locked neighbor acts as anchor

      const tmp = result[target]
      result[target] = result[i]
      result[i] = tmp
    }
  }

  // Detect whether anything actually moved
  let changed = false
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== shapes[i]) {
      changed = true
      break
    }
  }

  return { shapes: changed ? result : (shapes as Shape[]), changed }
}
