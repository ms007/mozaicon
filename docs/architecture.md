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

// Lookup by id (derived, memoized by Jotai)
export const shapeByIdAtom = atom((get) => {
  const shapes = get(shapesAtom)
  return new Map(shapes.map((s) => [s.id, s]))
})
```

### Selection Atom (`src/store/atoms/selection.ts`)

```ts
import { atom } from 'jotai'
import { shapeByIdAtom } from './document'

export const selectedIdsAtom = atom<string[]>([])

// Derived: the actual selected Shape objects
export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  const byId = get(shapeByIdAtom)
  return ids.map((id) => byId.get(id)).filter(Boolean)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)
```

### History Atom (`src/store/atoms/history.ts`)

```ts
import { atom } from 'jotai'
import type { Document } from '@/types/shapes'

export type HistoryEntry = {
  label: string // e.g. "Move shape", "Change fill"
  before: Document
  after: Document
}

export const undoStackAtom = atom<HistoryEntry[]>([])
export const redoStackAtom = atom<HistoryEntry[]>([])

export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0)
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0)
```

### Per-Shape Atoms (`atomFamily`)

When a UI surface (e.g. a single shape's property editor) cares about one shape but nothing else, subscribing to `documentAtom` or `shapesAtom` re-renders on every unrelated change. Use `atomFamily` to get one atom per shape id:

```ts
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { shapeByIdAtom } from './document'

export const shapeAtom = atomFamily((id: string) => atom((get) => get(shapeByIdAtom).get(id)))
```

`shapeAtom('abc')` returns a stable atom per id, so two editors looking at the same shape share a subscription.

**Lifecycle.** `atomFamily` caches per key. When a shape is deleted, the entry stays in the cache until you evict it — call `shapeAtom.remove(id)` from the same command that removes the shape, otherwise the family leaks.

Not yet used in the codebase (as of this writing) — `splitAtom` covers canvas rendering. Reach for `atomFamily` when you need keyed lookup outside the canvas list.

## State Categories: Document vs UI

Atoms in the store fall into two categories with different mutation rules:

**Document state** (`documentAtom`): the SVG being edited. Mutations must go through commands so they're undoable. `HistoryEntry` snapshots `documentAtom` only.

**UI state** (`selectedIdsAtom`, `activeToolAtom`, `draftShapeAtom`, `activeDragAtom`, …): transient interaction state. Features may write these directly — no command, no history entry. UI state is **not** restored by undo/redo.

Consequence: if undo removes a shape whose id is still in `selectedIdsAtom`, the selection holds a stale id. Derived atoms that consume selection must filter stale references against `shapeByIdAtom`. `selectedShapesAtom` already does this.

If a piece of UI state ever needs to participate in undo/redo, promote it: move its mutation into a command and extend `HistoryEntry`. Don't add per-atom selective snapshots.

## Command Pattern

Commands are **write-only atoms**. They:

1. Compute the new document state
2. Push a `HistoryEntry` onto the undo stack
3. Clear the redo stack

### Command Template (`src/store/commands/createCommand.ts`)

```ts
import { atom } from 'jotai'
import { documentAtom } from '../atoms/document'
import { undoStackAtom, redoStackAtom } from '../atoms/history'
import type { Document } from '@/types/shapes'

// Helper: wrap a mutation so it becomes undoable
export function createCommand<Payload>(
  label: string,
  apply: (doc: Document, payload: Payload) => Document,
) {
  return atom(null, (get, set, payload: Payload) => {
    const before = get(documentAtom)
    const after = apply(before, payload)
    if (after === before) return // no-op guard

    set(documentAtom, after)
    set(undoStackAtom, (s) => [...s, { label, before, after }])
    set(redoStackAtom, [])
  })
}
```

**Testing rule.** Every command must cover both of these. The canonical pattern lives in `src/store/commands/createCommand.test.ts`:

1. **Happy path** — dispatch with a valid payload, assert `documentAtom` changed and a `HistoryEntry` with the right `label` was pushed.
2. **No-op invariant** — pick the variant that fits the command:
   - If `apply()` can return the same `Document` reference for some payload (e.g. moving a missing id), dispatch that and assert the undo stack stays empty.
   - If `apply()` structurally always returns a new reference (e.g. `addShape` appending with a fresh ULID), prove the invariant that makes that the case — e.g. two dispatches yield shapes with distinct ids (see `addShape.test.ts`).

Redo-stack clearing is guaranteed by `createCommand` itself; individual command tests may repeat it as belt-and-suspenders but it isn't required.

### Example Command: Move Shape (`src/store/commands/moveShape.ts`)

```ts
import { produce } from 'immer'
import { createCommand } from './createCommand'

export const moveShapeCommand = createCommand<{
  id: string
  dx: number
  dy: number
}>('Move shape', (doc, { id, dx, dy }) =>
  produce(doc, (draft) => {
    const shape = draft.shapes.find((s) => s.id === id)
    if (!shape) return
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
        // delegate to lib/svg/transformPath
        shape.d = translatePath(shape.d, dx, dy)
        break
    }
  }),
)
```

### Usage in a Component

```tsx
import { useSetAtom } from 'jotai'
import { moveShapeCommand } from '@/store/commands/moveShape'

function ShapeHandle({ id }: { id: string }) {
  const moveShape = useSetAtom(moveShapeCommand)

  const onDrag = (dx: number, dy: number) => {
    moveShape({ id, dx, dy })
  }
  // ...
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

## Rendering the Canvas

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
- **Pointer-driven mutation commands** (e.g. dragging an existing shape to move it) batch via `requestAnimationFrame` so a single command dispatches per frame. Transient UI-atom updates during a drag (e.g. `draftShapeAtom` while _Drag-to-Draw_ is in progress) are not commands and don't need their own rAF loop — React batches the re-render.
- **SVGO is expensive** — run it in a Web Worker if export feels slow (> 100ms).

## Where to Start Reading the Code

If you're new to the codebase, read files in this order:

1. `src/types/shapes.ts` — the data model
2. `src/store/atoms/document.ts` — the root state
3. `src/store/commands/createCommand.ts` — the command pattern
4. `src/features/canvas/CanvasStage.tsx` — how rendering subscribes to atoms
5. `src/features/export/serialize.ts` — how state becomes SVG
