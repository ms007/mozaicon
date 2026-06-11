# Architecture

The system overview: how state, commands, rendering, and persistence fit together. The subsystem deep-dives live in their own docs:

- [`state.md`](./state.md) — data model (Zod schemas), atom graph, Project-vs-UI state categories
- [`commands.md`](./commands.md) — command pattern, `createCommand` / `createProjectCommand`, undo/redo, layer reorder
- [`gestures.md`](./gestures.md) — gesture registry, drafts, translation gestures, Escape priority

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

## State at a Glance

`projectAtom` (the single Immer root) holds the whole `Project`; the `activeIconAtom` lens projects the active icon onto everything downstream (shapes, layers, bboxes, export). Selection lives in its own read-only atom written only through command seams; history snapshots the whole project per entry. Schemas, atoms, and the Project-vs-UI split → [`state.md`](./state.md). How mutations and undo/redo work → [`commands.md`](./commands.md).

## Rendering the Canvas

Static visual scaffolding (surface hierarchy, Artboard, Pixel Grid, the Canvas-is-SVG invariant) is documented in [`canvas-chrome.md`](./canvas-chrome.md). Gesture-driven draft overlays are documented in [`gestures.md`](./gestures.md). This section covers how atoms project into DOM.

The canvas uses `splitAtom` so each shape subscribes only to itself:

```tsx
import { useAtomValue } from 'jotai'
import { shapeAtomsAtom } from '@/store/atoms/project'
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
  return <ElementPrinter element={shapeToElement(shape)} />
}
```

**Why this matters:** With 500 shapes, dragging one triggers one `<ShapeRenderer>` re-render — not 500.

## Export Pipeline

```
activeIconAtom → serialize (features/export/serialize.ts) → SVGO → file-saver
```

- Serialization is a **pure function** of the document. No React, no atoms.
- SVGO runs in the browser (via `svgo` npm package).
- Export options (minify, precision, viewBox trim) are their own atom (`exportOptionsAtom`).

Full pipeline, Export Parity invariant, and naming rules → [`export.md`](./export.md).

## Persistence

Persistence is **designed for but not yet wired** (follow-up to PRD #219). The state is shaped so a thin persistence subscriber attaches to `projectAtom` without leaking storage concerns into commands:

- **Dexie** (IndexedDB) will store the project keyed by its id.
- Auto-save will be a Jotai effect atom that debounces writes on `projectAtom` changes (1s debounce).
- On app load, the stored project hydrates `projectAtom` via Zod validation — if the schema fails, we fall back to a blank single-icon project and log a warning.
- **Auto-save reacts to undo/redo like any other mutation.** `undoCommand` writes `projectAtom`, the debounce fires, the rewound state is persisted. Reload after an undo brings back the undone state; the history stacks themselves are session-local and start empty on reload. This means: undo survives reload, redo does not.

## Testing Strategy Per Layer

| Layer      | Test Type    | Example                                              |
| ---------- | ------------ | ---------------------------------------------------- |
| `lib/`     | Vitest unit  | `translatePath('M0 0 L10 0', 5, 5) === 'M5 5 L15 5'` |
| Atoms      | Vitest       | Dispatch command → assert atom value                 |
| Components | Vitest + RTL | Properties panel updates fill on input change        |
| Canvas     | Playwright   | Drag handle → shape moves → undo restores            |
| Export     | Vitest       | Snapshot test on serialized SVG                      |

## Performance Notes

- **Never read `projectAtom` or `activeIconAtom` in the canvas render path.** Always go through `shapeAtomsAtom` or derived atoms.
- **Avoid `produce` in derived atoms** — they should be pure reads.
- **Draft-then-commit for gestures.** Pointer moves write a transient draft atom; a single undoable command fires on `pointerup`. Per-frame commands would flood the undo stack. Draft writes are frame-throttled (≤1 per frame) via the Gesture Sampler — see [`gestures.md`](./gestures.md).
- **SVGO is expensive** — run it in a Web Worker if export feels slow (> 100ms).

## Where to Start Reading the Code

If you're new to the codebase, read files in this order:

1. `src/types/shapes.ts` — the data model
2. `src/store/atoms/project.ts` — the root state and the active-icon lens
3. `src/store/commands/createCommand.ts` — the command pattern
4. `src/features/canvas/CanvasStage.tsx` — how rendering subscribes to atoms
5. `src/features/export/serialize.ts` — how state becomes SVG
