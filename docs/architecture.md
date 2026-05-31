# Architecture

This document describes how state, commands, rendering, and persistence fit together in the SVG Icon Creator.

## Guiding Principles

1. **Atomic state, derived views.** Small focused atoms; composition via derived atoms.
2. **Mutations go through commands.** Every user-visible change is a named, undoable operation.
3. **React renders state.** No imperative DOM manipulation. The SVG is a pure function of atoms.
4. **Pure core, thin shell.** Geometry/path math lives in `lib/` as plain functions — testable without React.

## Layers

```
┌─────────────────────────────────────────────┐
│  UI Layer (features/*)                      │
│  - Canvas, Toolbar, Properties, Export      │
│  - Reads atoms, dispatches commands         │
├─────────────────────────────────────────────┤
│  Command Layer (store/commands/)            │
│  - Write-only atoms                         │
│  - Push onto history stack                  │
├─────────────────────────────────────────────┤
│  State Layer (store/atoms/)                 │
│  - Primitive atoms (document, selection)    │
│  - Derived atoms (shapesById, bbox, ...)    │
│  - atomFamily / splitAtom for fine-grained  │
├─────────────────────────────────────────────┤
│  Pure Core (lib/)                           │
│  - Geometry, path math, SVG serialization   │
│  - No React, no atoms, fully testable       │
└─────────────────────────────────────────────┘
```

## State Shape

### Types (`src/types/shapes.ts`)

```ts
import { z } from 'zod'

export const Vec2 = z.object({ x: z.number(), y: z.number() })

const ShapeBase = z.object({
  id: z.string(), // stable, ULID
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
})

export const RectShape = ShapeBase.extend({
  type: z.literal('rect'),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rx: z.number().optional(),
})

export const CircleShape = ShapeBase.extend({
  type: z.literal('circle'),
  cx: z.number(),
  cy: z.number(),
  r: z.number(),
})

export const PathShape = ShapeBase.extend({
  type: z.literal('path'),
  d: z.string(), // SVG path data
})

export const Shape = z.discriminatedUnion('type', [RectShape, CircleShape, PathShape])
export type Shape = z.infer<typeof Shape>

export const Document = z.object({
  id: z.string(),
  name: z.string(),
  viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  shapes: z.array(Shape),
})
export type Document = z.infer<typeof Document>
```

## Core Atoms

### Document Atom (`src/store/atoms/document.ts`)

```ts
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'
import { splitAtom } from 'jotai/utils'
import type { Document, Shape } from '@/types/shapes'

// Root atom — the whole document. Only written by commands.
export const documentAtom = atomWithImmer<Document>({
  id: 'doc-1',
  name: 'Untitled',
  viewBox: [0, 0, 24, 24],
  shapes: [],
})

// Derived: just the shapes array
export const shapesAtom = atom((get) => get(documentAtom).shapes)

// Split atom: one atom per shape. Fine-grained subscriptions.
// Use this in the canvas so editing one shape doesn't re-render others.
export const shapeAtomsAtom = splitAtom(
  atom(
    (get) => get(documentAtom).shapes,
    (get, set, shapes: Shape[]) => {
      set(documentAtom, (draft) => {
        draft.shapes = shapes
      })
    },
  ),
)

// Per-shape lookup. atomWithImmer keeps unchanged shapes referentially
// stable, so .find() returns the same reference when other shapes mutate.
// Jotai's Object.is check then suppresses notification to subscribers of
// unaffected ids — which is what makes selectedShapesAtom cheap below.
export const shapeAtom = atomFamily((id: string) =>
  atom((get) => get(shapesAtom).find((s) => s.id === id)),
)
```

`atomFamily` comes from `jotai-family` (the `jotai/utils` export is deprecated and slated for removal in Jotai v3).

### Selection Atom (`src/store/atoms/selection.ts`)

```ts
import { atom } from 'jotai'
import { shapeAtom } from './document'

// Module-private — the only writable atom for selection state.
const _selectedIdsAtom = atom<string[]>([])

// Public: read-only. A direct set() fails to compile.
export const selectedIdsAtom = atom((get) => get(_selectedIdsAtom))

// Derived: the actual selected Shape objects. Subscribes only to the
// per-id atoms — mutating an unrelated shape doesn't re-run this.
export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  return ids.map((id) => get(shapeAtom(id))).filter((s) => s !== undefined)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)
```

**Writes are structurally sealed.** `selectedIdsAtom` is a read-only derived atom; a direct `set()` on it fails to compile. The only paths into selection state are two module-private write seams:

- `commitSelectionAtom` — normalises (dedup, z-order, stale-ID drop), compares to prior value, writes only on change. Used by `createCommand`.
- `restoreSelectionAtom` — writes verbatim without normalisation. Used by undo/redo to restore a snapshot.

`selectShapesCommand` (replace), `toggleSelectionCommand` (additive shift+click), and `clearSelectionCommand` (Escape / background click) each push one `HistoryEntry`. They enforce two invariants on every write: IDs are deduplicated, and the array is sorted by document z-order (position in `documentAtom.shapes`). The stale-id filter inside `selectedShapesAtom` stays as defense-in-depth — the primary mechanism that keeps selection consistent across history is the snapshot, not the filter.

If a future surface needs "which shape did the user click first" (e.g. an Align anchor), that's its own atom — don't smuggle the meaning into list position.

### History Atom (`src/store/atoms/history.ts`)

```ts
import { atom } from 'jotai'
import type { Document } from '@/types/shapes'

export type HistoryEntry = {
  label: string // e.g. "Move shape", "Change fill"
  before: Document
  after: Document
  selectionBefore: string[]
  selectionAfter: string[]
}

export const undoStackAtom = atom<HistoryEntry[]>([])
export const redoStackAtom = atom<HistoryEntry[]>([])

// Both flags fold in the gesture check: while an Active Gesture runs, history
// is frozen and the toolbar's undo/redo buttons grey out automatically.
export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0 && !get(isGestureActiveAtom))
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0 && !get(isGestureActiveAtom))
```

### Per-Shape Atoms (`atomFamily`)

When a UI surface (e.g. a single shape's property editor) cares about one shape but nothing else, subscribing to `documentAtom` or `shapesAtom` re-renders on every unrelated change. `shapeAtom` (defined in `document.ts` above) gives you one stable atom per shape id — two editors looking at the same shape share a subscription.

**Lifecycle.** `atomFamily` caches per key. When a shape is deleted, the entry stays in the cache until you evict it — call `shapeAtom.remove(id)` from the same command that removes the shape, otherwise the family leaks.

**Undo after delete reuses the id, not the atom.** Once the delete command has called `shapeAtom.remove(id)`, an undo that restores the same shape creates a _new_ atom on the next read. The canvas list (`splitAtom`) keys on atom identity, so the corresponding `ShapeRenderer` unmounts and remounts. The convention that makes this safe: **`ShapeRenderer` and any per-shape canvas component stays stateless.** If a future renderer needs local state (entrance animation, inline-edit cursor, hover-driven affordance), park that state in a separate id-keyed atom — not in React component state.

`shapeAtom` powers `selectedShapesAtom`; reach for it directly when you need keyed lookup outside the canvas list (e.g. a property panel bound to a single shape). The canvas list itself uses `splitAtom` (`shapeAtomsAtom`).

## State Categories: Document vs UI

Atoms in the store fall into two categories with different mutation rules:

**Document state** (`documentAtom`): the SVG being edited. Mutations must go through commands so they're undoable.

**UI state** (`activeToolAtom`, `draftShapeAtom`, `resizeDraftAtom`, `moveDraftAtom`, …): transient interaction state. Features may write these directly — no command, no history entry. UI state is **not** restored by undo/redo.

**Selection is the exception.** `selectedIdsAtom` is UI state by lifecycle (session-local, not persisted by export or save), but every effective change to it is itself a Figma-style Undo step — click shape A, then click shape B, then `Cmd+Z` restores the selection to A without touching the document. Selection therefore lives on the _same_ history stack as the document. The public `selectedIdsAtom` is read-only — its backing atom is module-private. The only write paths are `commitSelectionAtom` (normalising, used by `createCommand`) and `restoreSelectionAtom` (verbatim, used by undo/redo). This is a structural guarantee, not a convention. A `HistoryEntry` snapshots both axes (`before`/`after` for the document, `selectionBefore`/`selectionAfter` for selection); a _Selection-Command_ leaves the document axis untouched (`before === after`), a _Combined Command_ moves both atomically.

Consumers of selection still filter stale ids against the per-shape atoms as defense-in-depth (`selectedShapesAtom` already does this), but the primary mechanism that keeps selection consistent across history is the snapshot, not the filter.

If any other UI atom ever wants in on undo/redo, the bar is high: justify it against the principle that history's job is to roll back the _document_ and the _semantic context that drove each mutation_, nothing else.

## Command Pattern

Commands are **write-only atoms**. They:

1. Compute the new document state and/or the new selection
2. Push a `HistoryEntry` onto the undo stack
3. Clear the redo stack

Three flavours fall out of one primitive: **document-only** commands (e.g. `moveShapeCommand`), **selection-only** commands (e.g. `clearSelectionCommand`), and **combined** commands (e.g. `addShapeCommand`, which creates a shape _and_ selects it as one atomic step).

### Command Template (`src/store/commands/createCommand.ts`)

```ts
import { atom } from 'jotai'
import { documentAtom } from '../atoms/document'
import { commitSelectionAtom, selectedIdsAtom } from '../atoms/selection'
import { isGestureActiveAtom } from '../atoms/gesture'
import { undoStackAtom, redoStackAtom } from '../atoms/history'
import type { Document } from '@/types/shapes'

export type CommandResult = {
  document?: Document // omit to leave the document untouched
  selection?: string[] // omit to leave the selection untouched
}

export function createCommand<Payload>(
  label: string,
  apply: (doc: Document, payload: Payload, selection: string[]) => CommandResult,
) {
  return atom(null, (get, set, payload: Payload) => {
    if (get(isGestureActiveAtom)) return // freeze: gesture in flight

    const before = get(documentAtom)
    const selectionBefore = get(selectedIdsAtom)
    const result = apply(before, payload, selectionBefore)

    const after = result.document ?? before
    const { changed: selChanged, ids: selectionAfter } = result.selection
      ? set(commitSelectionAtom, { ids: result.selection, doc: after })
      : { changed: false, ids: selectionBefore }

    const docChanged = after !== before
    if (!docChanged && !selChanged) return // no-op on both axes

    if (docChanged) set(documentAtom, after)
    set(undoStackAtom, (s) => [...s, { label, before, after, selectionBefore, selectionAfter }])
    set(redoStackAtom, [])
  })
}
```

Three things this primitive owns and no caller has to think about:

- **Gesture freeze.** A dispatch during an _Active Gesture_ no-ops, regardless of flavour.
- **Selection normalisation.** Dedup + z-order sort + stale-id drop happens at the write boundary. Commands return any list; what lands in `selectedIdsAtom` is canonical.
- **No-op guard on both axes.** An idempotent selection write (same set, same order after normalisation) doesn't push history any more than a no-op document mutation does.

**Testing rule.** Every command must cover both of these. The canonical pattern lives in `src/store/commands/createCommand.test.ts`:

1. **Happy path** — dispatch with a valid payload, assert the axis (or axes) it claims to touch actually changed, assert one `HistoryEntry` with the right `label` was pushed, and assert the snapshot's `before`/`after` and `selectionBefore`/`selectionAfter` are consistent with what the command did.
2. **No-op invariant** — pick the variant that fits the command:
   - Document-only commands: if `apply()` can return `{ document: before }` for some payload (e.g. moving a missing id), dispatch that and assert the undo stack stays empty. If `apply()` structurally always changes the document (e.g. `addShape` appending with a fresh ULID), prove the invariant that makes that the case — e.g. two dispatches yield shapes with distinct ids.
   - Selection-only commands: dispatch with the same selection that's already active (after normalisation) and assert the undo stack stays empty.
   - Combined commands: cover both — e.g. `addShape` always pushes (new id ⇒ document and selection both change); `deleteShape` of a missing id is a full no-op.

Redo-stack clearing is guaranteed by `createCommand` itself; individual command tests may repeat it as belt-and-suspenders but it isn't required.

### Example Command: Move Selection (`src/store/commands/moveSelection.ts`)

```ts
import { produce } from 'immer'

import { translatePath } from '@/lib/svg/translatePath'

import { createCommand } from './createCommand'

export const moveSelectionCommand = createCommand<{
  ids: string[]
  dx: number
  dy: number
}>('Move selection', (doc, { ids, dx, dy }) => {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return {}
  const idSet = new Set(ids)
  const next = produce(doc, (draft) => {
    for (const shape of draft.shapes) {
      if (!idSet.has(shape.id)) continue
      switch (shape.type) {
        case 'rect':
          shape.x += dx
          shape.y += dy
          break
        case 'circle':
          shape.cx += dx
          shape.cy += dy
          break
        case 'path':
          shape.d = translatePath(shape.d, dx, dy)
          break
      }
    }
  })
  return next === doc ? {} : { document: next }
})
```

Multi-shape on purpose: a single dispatch translates every shape in the _Move Set_ by the same `{ dx, dy }` and pushes one _History Entry_. The Move Set is captured at gesture promotion and arrives here as `ids`; this command does not consult `selectedIdsAtom` itself.

### Usage in a Component

Pointer-driven gestures follow the _Draft-then-commit_ pattern: every `pointermove` writes the transient draft atom, a single command dispatches on `pointerup`.

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

### Undo / Redo (`src/store/commands/history.ts`)

```ts
import { atom } from 'jotai'
import { documentAtom } from '../atoms/document'
import { undoStackAtom, redoStackAtom } from '../atoms/history'

export const undoCommand = atom(null, (get, set) => {
  const stack = get(undoStackAtom)
  const entry = stack.at(-1)
  if (!entry) return
  set(documentAtom, entry.before)
  set(undoStackAtom, stack.slice(0, -1))
  set(redoStackAtom, (s) => [...s, entry])
})

export const redoCommand = atom(null, (get, set) => {
  const stack = get(redoStackAtom)
  const entry = stack.at(-1)
  if (!entry) return
  set(documentAtom, entry.after)
  set(redoStackAtom, stack.slice(0, -1))
  set(undoStackAtom, (s) => [...s, entry])
})
```

Both meta-commands also restore selection via `restoreSelectionAtom` (`entry.selectionBefore` on undo, `entry.selectionAfter` on redo) — omitted above for brevity.

**History is frozen during an Active Gesture.** _All_ commands no-op while a drag-to-draw, drag-to-move, resize, or drag-to-select is in flight (`get(isGestureActiveAtom)` is true) — document, selection, and combined alike — and `undoCommand`/`redoCommand` are frozen along with them. `isGestureActiveAtom` (re-exported from the _Gesture Registry_'s `isAnyGestureActiveAtom`) is true whenever any registered adapter's draft atom is non-null. The freeze lives in `createCommand` itself, not only in the meta-commands, so a stray background event (layers-panel click, `Cmd+A`, programmatic selection) can't yank state out from under the gesture. The pending change isn't in history yet — it only commits on `pointerup` via a single command — so rewinding mid-gesture would mix half-drafted UI state with a rewound document. To cancel a gesture, use Escape (separate mechanism). `canUndoAtom` and `canRedoAtom` fold in the same check, so the toolbar buttons grey out automatically.

History stacks are unbounded. Memory cost is bounded in practice by Immer's structural sharing — `before` and `after` reuse every unmodified shape sub-tree — and by the small size of typical icon documents. If long sessions become an observed problem, revisit with data rather than a preemptive cap.

The `label` field on `HistoryEntry` is currently consumed only by tests and dev tooling. When it surfaces in UI later (tooltip on the undo button, history panel, post-undo toast), labels will need an i18n migration — they are hardcoded English strings today.

## Cancellation & Escape Priority

### Gesture Registry (`src/store/atoms/gestures/registry.ts`)

The gesture registry is the single source of truth for "which gestures exist and which is active". It is an ordered list of `GestureAdapter` objects — currently Marquee → Resize → Move → Draw — each wrapping a draft atom and an optional `displayBbox` callback. The core invariant is **Active Gesture iff draft atom is non-null**: a gesture is in flight exactly when its adapter's draft atom holds a value, and at most one adapter is active at any time (each pointer-driven hook owns a single `dragRef` and the hooks all listen on the same `window` pointer events). The at-most-one-active invariant is verified by a contract test in `registry.test.ts`.

Three derived atoms are computed from the registry:

- **`isAnyGestureActiveAtom`** — `true` iff any adapter's draft is non-null. Powers the command freeze in `createCommand`: while an _Active Gesture_ runs, every command dispatch — document, selection, combined — is a no-op. The freeze lives in `createCommand` itself, not only in `undoCommand` / `redoCommand`, so a stray background event (layers-panel click, `Cmd+A`, a programmatic selection write) cannot mutate state mid-drag.
- **`displayedSelectionBboxFromRegistryAtom`** — resolves what selection bbox to render by iterating adapters in precedence order. Each active adapter's `displayBbox` returns a `DisplayContribution`, a tagged union with three variants: `rect` (override with a concrete rect), `hide` (suppress the bbox entirely — returns `null`), `passThrough` (skip this adapter, continue to the next). If no adapter is active or all pass through, the atom falls back to `selectionBboxAtom`. Precedence order means Marquee's contribution always wins over Resize, Resize over Move, etc.
- **`cancelGesturesAtom`** — one write sets every adapter's draft to `null`. Safe because at most one gesture is active at any time — one Cancel covers them all.

Adding a new pointer-driven gesture means writing a `GestureAdapter` (draft atom + optional `displayBbox`) and inserting it at the correct precedence position in the registry list.

`Escape` is a priority ladder, evaluated in `bindings.ts` (`canvas.escape`) with **early return after the first matching tier**:

1. Active gesture → `cancelDraftAtom`, return. The pending change is not a _History Entry_ yet, so there is nothing to undo — only transient drafts to clear.
2. Active tool → deactivate (`activeToolAtom → null`), return.
3. Non-empty selection → `clearSelectionCommand`, return.

The ladder is "one step up" — Escape never reaches past the first tier that applies. Combining tiers in a single press (cancel _and_ clear selection together) is a regression: cancel means "return to the state before the gesture started", not "throw away gesture and selection in one stroke".

## Rendering the Canvas

Static visual scaffolding (surface hierarchy, Artboard, Pixel Grid, the Canvas-is-SVG invariant) is documented in [`canvas-chrome.md`](./canvas-chrome.md). This section covers the gesture-driven rendering pipeline — how atoms project into DOM and how draft overlays layer on top.

The canvas uses `splitAtom` so each shape subscribes only to itself:

```tsx
import { useAtomValue } from 'jotai'
import { shapeAtomsAtom } from '@/store/atoms/document'
import { ShapeRenderer } from './ShapeRenderer'

export function Canvas() {
  const shapeAtoms = useAtomValue(shapeAtomsAtom)
  return (
    <svg viewBox="0 0 24 24">
      {shapeAtoms.map((shapeAtom) => (
        <ShapeRenderer key={`${shapeAtom}`} shapeAtom={shapeAtom} />
      ))}
    </svg>
  )
}

// This component re-renders ONLY when its own shape changes.
function ShapeRenderer({ shapeAtom }: { shapeAtom: PrimitiveAtom<Shape> }) {
  const shape = useAtomValue(shapeAtom)
  switch (shape.type) {
    case 'rect':
      return <rect {...shape} />
    case 'circle':
      return <circle {...shape} />
    case 'path':
      return <path d={shape.d} fill={shape.fill} />
  }
}
```

**Why this matters:** With 500 shapes, dragging one triggers one `<ShapeRenderer>` re-render — not 500.

## Export Pipeline

```
documentAtom → serialize (lib/svg/serialize.ts) → SVGO → file-saver
```

- Serialization is a **pure function** of the document. No React, no atoms.
- SVGO runs in the browser (via `svgo` npm package).
- Export options (minify, precision, viewBox trim) are their own atom (`exportOptionsAtom`).

See `src/features/export/` for the implementation and `export.test.ts` for golden-file tests.

## Persistence

- **Dexie** (IndexedDB) stores projects keyed by document id.
- Auto-save is a Jotai effect atom that debounces writes on `documentAtom` changes (1s debounce).
- On app load, the last-opened document hydrates `documentAtom` via Zod validation — if the schema fails, we fall back to a blank document and log a warning.
- **Auto-save reacts to undo/redo like any other mutation.** `undoCommand` writes `documentAtom`, the debounce fires, the rewound state is persisted. Reload after an undo brings back the undone state; the history stacks themselves are session-local and start empty on reload. This means: undo survives reload, redo does not.

## Testing Strategy Per Layer

| Layer      | Test Type    | Example                                              |
| ---------- | ------------ | ---------------------------------------------------- |
| `lib/`     | Vitest unit  | `translatePath('M0 0 L10 0', 5, 5) === 'M5 5 L15 5'` |
| Atoms      | Vitest       | Dispatch command → assert atom value                 |
| Components | Vitest + RTL | Properties panel updates fill on input change        |
| Canvas     | Playwright   | Drag handle → shape moves → undo restores            |
| Export     | Vitest       | Snapshot test on serialized SVG                      |

## Performance Notes

- **Never read `documentAtom` in the canvas render path.** Always go through `shapeAtomsAtom` or derived atoms.
- **Avoid `produce` in derived atoms** — they should be pure reads.
- **Draft-then-commit for gestures.** Interactive gestures (resize, move) write a transient draft atom (`resizeDraftAtom`, `draftShapeAtom`) on every pointer move — these are UI state, not commands. A single undoable command fires on `pointerup`. Per-frame commands are **not** the rule; they would flood the undo stack and thrash document snapshots.
- **Frame-throttled draft writes via the Gesture Sampler.** During a pointer-driven gesture (move, resize, draw), each `pointermove` calls `gestureSampler.schedule()` instead of writing the draft atom directly. The sampler coalesces samples so at most one draft write fires per animation frame (≤1 per frame). No commands dispatch mid-gesture — the draft atom is UI state, not a command. On `pointerup` the gesture commits from the up-event coordinate: a single undoable command dispatches once, and `gestureSampler.stop()` cancels any pending frame. This avoids flooding the undo stack with per-frame entries and keeps document snapshots stable for the gesture's duration.
- **SVGO is expensive** — run it in a Web Worker if export feels slow (> 100ms).

## Where to Start Reading the Code

If you're new to the codebase, read files in this order:

1. `src/types/shapes.ts` — the data model
2. `src/store/atoms/document.ts` — the root state
3. `src/store/commands/createCommand.ts` — the command pattern
4. `src/features/canvas/CanvasStage.tsx` — how rendering subscribes to atoms
5. `src/features/export/serialize.ts` — how state becomes SVG
