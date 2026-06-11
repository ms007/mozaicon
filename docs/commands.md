# Commands

Every user-visible mutation is a named, undoable operation dispatched through a write-only atom. The atoms these commands write are documented in [`state.md`](./state.md); the gesture system that defers pointer-driven mutations until `pointerup` is in [`gestures.md`](./gestures.md).

## Command Pattern

Commands are **write-only atoms**. They:

1. Compute the new state (icon, project, and/or selection)
2. Push a `HistoryEntry` onto the undo stack
3. Clear the redo stack

Three flavours fall out of the `createCommand` primitive: **icon-only** commands (e.g. `moveSelectionCommand`), **selection-only** commands (e.g. `clearSelectionCommand`), and **combined** commands (e.g. `addShapeCommand`, which creates a shape _and_ selects it as one atomic step). A fourth family — the **project-level icon commands** — lives outside `createCommand`; see _Icon Commands_ below.

### Command Template (`src/store/commands/createCommand.ts`)

```ts
import { atom } from 'jotai'
import { activeIconAtom, projectAtom } from '../atoms/project'
import { commitSelectionAtom, selectedIdsAtom } from '../atoms/selection'
import { isGestureActiveAtom } from '../atoms/gesture'
import { undoStackAtom, redoStackAtom } from '../atoms/history'
import type { Icon } from '@/types/shapes'

export type CommandResult = {
  icon?: Icon // omit to leave the active icon untouched
  selection?: string[] // omit to leave the selection untouched
}

export function createCommand<Payload>(
  label: string,
  apply: (icon: Icon, payload: Payload, selection: string[]) => CommandResult,
) {
  return atom(null, (get, set, payload: Payload) => {
    if (get(isGestureActiveAtom)) return // freeze: gesture in flight

    const beforeProject = get(projectAtom)
    const beforeIcon = get(activeIconAtom)
    const selectionBefore = get(selectedIdsAtom)
    const result = apply(beforeIcon, payload, selectionBefore)

    const afterIcon = result.icon ?? beforeIcon
    const { changed: selChanged, ids: selectionAfter } = result.selection
      ? set(commitSelectionAtom, { ids: result.selection, doc: afterIcon })
      : { changed: false, ids: selectionBefore }

    const iconChanged = afterIcon !== beforeIcon
    if (!iconChanged && !selChanged) return // no-op on both axes

    if (iconChanged) set(activeIconAtom, afterIcon)

    const afterProject = get(projectAtom)
    set(undoStackAtom, (s) => [
      ...s,
      { label, before: beforeProject, after: afterProject, selectionBefore, selectionAfter },
    ])
    set(redoStackAtom, [])
  })
}
```

Note the asymmetry: `apply` stays **icon-scoped** — shape commands never see the Project — but the history snapshot it pushes is **project-wide** (`beforeProject`/`afterProject`). That's the seam that let multi-icon support land without rewriting any shape command.

Three things this primitive owns and no caller has to think about:

- **Gesture freeze.** A dispatch during an _Active Gesture_ no-ops, regardless of flavour.
- **Selection normalisation.** Dedup + z-order sort + stale-id drop happens at the write boundary. Commands return any list; what lands in `selectedIdsAtom` is canonical.
- **No-op guard on both axes.** An idempotent selection write (same set, same order after normalisation) doesn't push history any more than a no-op document mutation does.

**Testing rule.** Every command must cover both of these. The canonical pattern lives in `src/store/commands/createCommand.test.ts`:

1. **Happy path** — dispatch with a valid payload, assert the axis (or axes) it claims to touch actually changed, assert one `HistoryEntry` with the right `label` was pushed, and assert the snapshot's `before`/`after` and `selectionBefore`/`selectionAfter` are consistent with what the command did.
2. **No-op invariant** — pick the variant that fits the command:
   - Icon-only commands: if `apply()` can return `{ icon: before }` for some payload (e.g. moving a missing id), dispatch that and assert the undo stack stays empty. If `apply()` structurally always changes the icon (e.g. `addShape` appending with a fresh ULID), prove the invariant that makes that the case — e.g. two dispatches yield shapes with distinct ids.
   - Selection-only commands: dispatch with the same selection that's already active (after normalisation) and assert the undo stack stays empty.
   - Combined commands: cover both — e.g. `addShape` always pushes (new id ⇒ document and selection both change); `deleteShape` of a missing id is a full no-op.

Redo-stack clearing is guaranteed by `createCommand` itself; individual command tests may repeat it as belt-and-suspenders but it isn't required.

### Example Command: Move Selection (`src/store/commands/moveSelection.ts`)

```ts
import { translateShape } from '@/lib/geometry/translate'

import { createCommand } from './createCommand'

export const moveSelectionCommand = createCommand<{
  ids: string[]
  dx: number
  dy: number
}>('Move selection', (doc, { ids, dx, dy }) => {
  if (ids.length === 0) return {}
  if (dx === 0 && dy === 0) return {}

  const idSet = new Set(ids)
  const nextShapes = doc.shapes.map((shape) =>
    idSet.has(shape.id) ? translateShape(shape, dx, dy) : shape,
  )

  const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
  if (!changed) return {}
  return { icon: { ...doc, shapes: nextShapes } }
})
```

Multi-shape on purpose: a single dispatch translates every shape in the _Move Set_ by the same `{ dx, dy }` and pushes one _History Entry_. The per-shape type switch lives in `translateShape` (pure function in `lib/`), so the command stays generic. The Move Set is captured at gesture promotion and arrives here as `ids`; this command does not consult `selectedIdsAtom` itself.

### Usage in a Component

Pointer-driven gestures follow the _Draft-then-commit_ pattern: every `pointermove` writes the transient draft atom, a single command dispatches on `pointerup`. See [`gestures.md`](./gestures.md).

```tsx
import { useSetAtom } from 'jotai'

import { moveSelectionCommand } from '@/store/commands/moveSelection'

function useCommitMove() {
  const moveSelection = useSetAtom(moveSelectionCommand)

  return (ids: string[], dx: number, dy: number) => {
    moveSelection({ ids, dx, dy })
  }
}
```

### Icon Commands (`src/store/commands/iconCommands.ts`)

The project-level commands operate on the `Project` itself — outside the icon-scoped `createCommand` contract — so they are built on `createProjectCommand`, a sibling factory next to `createCommand` (same file) that owns the shared protocol once: gesture freeze, before/after project snapshot, selection via `commitSelectionAtom`, one `HistoryEntry`, clear redo. A command's `apply(project, payload)` returns `undefined` for a no-op, or `{ mutate, selectionDoc? }` — `mutate` receives the Immer draft of the project, and `selectionDoc` (when present) is the icon against which the empty selection is committed (`addIconCommand`: the new icon; `switchIconCommand`: the target; `deleteIconCommand`: the successor, only when the deleted icon was active; `renameIconCommand`: omitted, so the selection is untouched). `createCommand`'s apply stays icon-scoped — the two factories are siblings sharing the history-entry shape, not layers of one another.

- **`addIconCommand`** — appends a new empty icon (viewBox inherited from the active icon, default name `Icon ${nextIconNumber}`), bumps `nextIconNumber`, makes it active, clears selection. Combined: one entry.
- **`switchIconCommand`** — sets `activeIconId` _and_ clears the selection in one entry (Figma page-switch model). No-op when the target is already active or unknown.
- **`renameIconCommand`** — sets an icon's name. No-op when unchanged; empty/whitespace names are guarded at the UI layer and fall back to the export naming default.
- **`deleteIconCommand`** — removes an icon, enforcing the **≥1 invariant** (no-op at one icon). When the deleted icon was active, the successor is the previous sibling — or the next sibling when the deleted icon was first — and the selection clears. Like `deleteShapesCommand`, it evicts the `shapeAtom` family entries of the deleted icon's shapes after the splice (undo recreates them on demand).

`nextIconNumber` lives on the Project (not derived from names) so a number is never reused after a delete. Undoing an `addIconCommand` rolls the counter back with the snapshot — safe, because the icon that carried the number is gone too.

### Undo / Redo (`src/store/commands/historyCommands.ts`)

```ts
import { atom } from 'jotai'
import { projectAtom } from '../atoms/project'
import { undoStackAtom, redoStackAtom } from '../atoms/history'

export const undoCommand = atom(null, (get, set) => {
  const stack = get(undoStackAtom)
  const entry = stack[stack.length - 1]
  if (!entry) return
  set(projectAtom, entry.before)
  set(undoStackAtom, stack.slice(0, -1))
  set(redoStackAtom, (s) => [...s, entry])
})

export const redoCommand = atom(null, (get, set) => {
  const stack = get(redoStackAtom)
  const entry = stack[stack.length - 1]
  if (!entry) return
  set(projectAtom, entry.after)
  set(redoStackAtom, stack.slice(0, -1))
  set(undoStackAtom, (s) => [...s, entry])
})
```

Both meta-commands also restore selection via `restoreSelectionAtom` (`entry.selectionBefore` on undo, `entry.selectionAfter` on redo) — omitted above for brevity.

**History is frozen during an Active Gesture.** _All_ commands no-op while a drag-to-draw, drag-to-move, resize, or drag-to-select is in flight (`get(isGestureActiveAtom)` is true) — document, selection, and combined alike — and `undoCommand`/`redoCommand` are frozen along with them. `isGestureActiveAtom` (re-exported from the _Gesture Registry_'s `isAnyGestureActiveAtom`, see [`gestures.md`](./gestures.md)) is true whenever any registered adapter's draft atom is non-null. The freeze lives in `createCommand` itself, not only in the meta-commands, so a stray background event (layers-panel click, `Cmd+A`, programmatic selection) can't yank state out from under the gesture. The pending change isn't in history yet — it only commits on `pointerup` via a single command — so rewinding mid-gesture would mix half-drafted UI state with a rewound document. To cancel a gesture, use Escape (separate mechanism). `canUndoAtom` and `canRedoAtom` fold in the same check, so the toolbar buttons grey out automatically.

History stacks are unbounded. Memory cost is bounded in practice by Immer's structural sharing — `before` and `after` reuse every unmodified shape sub-tree — and by the small size of typical icon documents. If long sessions become an observed problem, revisit with data rather than a preemptive cap.

The `label` field on `HistoryEntry` is currently consumed only by tests and dev tooling. When it surfaces in UI later (tooltip on the undo button, history panel, post-undo toast), labels will need an i18n migration — they are hardcoded English strings today.

## Layer Reorder

Layer reorder — changing shape z-order via the Layers panel — is the first feature that combines a pure ordering core in `lib/` with thin intent commands that both return a re-normalised selection. The architecture separates the ordering math (pure, fully testable) from the undo/selection integration (commands).

### Pure ordering core (`src/lib/order/`)

Two modules, no React, no atoms:

- **`block.ts`** — block-insert operations. `moveBlockBefore(shapes, ids, beforeId)` removes the operating shapes (minus locked anchors) from their current positions and inserts them as a contiguous block before `beforeId` (`null` = append to end = front). `bringToFront(shapes, ids)` and `sendToBack(shapes, ids)` are convenience wrappers. All return `{ shapes, changed }` — the `changed` flag lets commands skip no-op history entries.
- **`reorderStep.ts`** — per-neighbor step. `reorderStep(shapes, selectedIds, direction)` walks the array (high-to-low for `'forward'`, low-to-high for `'backward'`) and swaps each movable shape past its nearest unselected neighbor. Locked shapes (even if selected) are fixed anchors and never move. A non-contiguous selection does _not_ collapse on a single step — each member moves independently relative to its own neighbor (Figma-style). Returns `{ shapes, changed }`.

### Intent commands (`src/store/commands/reorderShapes.ts`)

Two commands, deliberately separate rather than one overloaded payload:

- **`moveShapeBlockCommand`** `{ ids, beforeId }` — used by drag-to-reorder (drop) and the Shift bring-to-front / send-to-back shortcuts. Delegates to `moveBlockBefore`.
- **`reorderStepCommand`** `{ ids, direction }` — used by the single-step Cmd/Ctrl+] and Cmd/Ctrl+[ shortcuts. Delegates to `reorderStep`.

Both are **Combined Commands**: they return `{ icon, selection }` so one `HistoryEntry` atomically covers the new shape order _and_ a re-normalised selection. Re-normalisation (`normalizeSelection(ids, nextDoc)`) re-sorts the selected IDs by their new positions in the reordered shapes array, preserving the invariant that `selectedIdsAtom` is always z-order-sorted. Without this, undo would restore stale selection order and downstream derivations (multi-shape property panels, the selection bbox fold) would see the wrong sequence.

### Why Combined Command, not document-only + separate selection write

A document-only command would leave `selectedIdsAtom` holding the old z-order sort. A follow-up selection command would push a second `HistoryEntry`, making undo require two presses to revert one logical reorder. The Combined Command pattern (already used by `addShapeCommand` and `deleteShapesCommand`) solves both problems: one entry, both axes atomically consistent, one undo press.
