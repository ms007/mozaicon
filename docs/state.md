# State

The data model and the Jotai atom graph: schemas, the project/icon lens, selection, history, and the Project-vs-UI state split. The command layer that mutates this state is documented in [`commands.md`](./commands.md); the system overview lives in [`architecture.md`](./architecture.md).

## State Shape

### Types (`src/types/shapes.ts`)

```ts
import { z } from 'zod'

const ShapeBase = z.object({
  id: z.string(), // stable, ULID
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
})

export const Corners = z.object({
  radii: Radii, // [tl, tr, br, bl], clamped to half the smaller side at render
  style: CornerStyle, // 'rounded' | 'smooth'
  smoothing: z.number().min(0).max(100), // shape-wide squircle amount
})

export const RectShape = ShapeBase.extend({
  type: z.literal('rect'),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  corners: Corners,
})

export const Shape = z.discriminatedUnion('type', [RectShape])
export type Shape = z.infer<typeof Shape>

// One designable unit (formerly "Document" — term retired, see docs/glossary.md)
export const Icon = z.object({
  id: z.string(),
  name: z.string(),
  viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  shapes: z.array(Shape),
})
export type Icon = z.infer<typeof Icon>

// The top-level container: many icons, one active
export const Project = z.object({
  id: z.string(),
  icons: z.array(Icon),
  activeIconId: z.string(),
  // monotonic default-name counter — "highest ever assigned + 1", never reused
  nextIconNumber: z.number().int().positive(),
})
export type Project = z.infer<typeof Project>
```

## Core Atoms

### Project Atom & Active-Icon Lens (`src/store/atoms/project.ts`)

```ts
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'
import { splitAtom } from 'jotai/utils'
import type { Icon, Project, Shape } from '@/types/shapes'

// Root atom — the whole project. The single Immer root; only written by commands.
export const projectAtom = atomWithImmer<Project>({
  id: 'proj-1',
  icons: [{ id: 'icon-1', name: 'Icon 1', viewBox: [0, 0, 24, 24], shapes: [] }],
  activeIconId: 'icon-1',
  nextIconNumber: 2,
})

// Read/write lens onto project.icons[activeIconId]. Shape commands and canvas
// subscriptions operate on "the active icon" without knowing the Project exists.
export const activeIconAtom = atom(
  (get): Icon => {
    const project = get(projectAtom)
    const icon = project.icons.find((i) => i.id === project.activeIconId)
    if (!icon) throw new Error(`activeIconId "${project.activeIconId}" not found`)
    return icon
  },
  (_get, set, update: Icon | ((draft: Icon) => void)) => {
    set(projectAtom, (draft) => {
      const idx = draft.icons.findIndex((i) => i.id === draft.activeIconId)
      if (typeof update === 'function') update(draft.icons[idx])
      else draft.icons[idx] = update
    })
  },
)

// Derived: the active icon's shapes array
export const shapesAtom = atom(
  (get) => get(activeIconAtom).shapes,
  (_get, set, shapes: Shape[]) => {
    set(activeIconAtom, (draft) => {
      draft.shapes = shapes
    })
  },
)

// Split atom: one atom per shape. Fine-grained subscriptions.
// Use this in the canvas so editing one shape doesn't re-render others.
export const shapeAtomsAtom = splitAtom(shapesAtom)

// Feeds the Icons panel: id + name per icon, nothing else.
export const iconListAtom = atom((get) =>
  get(projectAtom).icons.map((i) => ({ id: i.id, name: i.name })),
)
export const activeIconIdAtom = atom((get) => get(projectAtom).activeIconId)

// Per-shape lookup. atomWithImmer keeps unchanged shapes referentially
// stable, so .find() returns the same reference when other shapes mutate.
// Jotai's Object.is check then suppresses notification to subscribers of
// unaffected ids — which is what makes selectedShapesAtom cheap below.
export const shapeAtom = atomFamily((id: string) =>
  atom((get) => get(shapesAtom).find((s) => s.id === id)),
)
```

Switching the active icon swaps the entire editable canvas: every atom downstream of `activeIconAtom` (shapes, layers, bboxes, export) re-projects onto the new icon. The lens is the seam that kept the multi-icon change mechanical — ~60 call-sites renamed `documentAtom` → `activeIconAtom` without behavioral change.

`atomFamily` comes from `jotai-family` (the `jotai/utils` export is deprecated and slated for removal in Jotai v3).

### Selection Atom (`src/store/atoms/selection.ts`)

```ts
import { atom } from 'jotai'
import { shapeAtom } from './project'

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

`selectShapesCommand` (replace), `toggleSelectionCommand` (additive shift+click), and `clearSelectionCommand` (Escape / background click) each push one `HistoryEntry`. They enforce two invariants on every write: IDs are deduplicated, and the array is sorted by z-order (position in the active icon's `shapes`). The stale-id filter inside `selectedShapesAtom` stays as defense-in-depth — the primary mechanism that keeps selection consistent across history is the snapshot, not the filter.

If a future surface needs "which shape did the user click first" (e.g. an Align anchor), that's its own atom — don't smuggle the meaning into list position.

### History Atom (`src/store/atoms/history.ts`)

```ts
import { atom } from 'jotai'
import type { Project } from '@/types/shapes'

export type HistoryEntry = {
  label: string // e.g. "Move shape", "Switch icon"
  before: Project
  after: Project
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

**History is Project-level.** `before`/`after` snapshot the whole `Project` — including `activeIconId` — so icon creation, switching, renaming, and deletion are ordinary entries on the same timeline as shape edits, and undo across an icon switch restores the prior icon as active together with its earlier selection. Immer structural sharing keeps unchanged icons referentially stable between snapshots, so widening the snapshot root from one icon to the project did not change per-entry memory cost in practice.

### Per-Shape Atoms (`atomFamily`)

When a UI surface (e.g. a single shape's property editor) cares about one shape but nothing else, subscribing to `projectAtom` or `shapesAtom` re-renders on every unrelated change. `shapeAtom` (defined in `project.ts` above) gives you one stable atom per shape id — two editors looking at the same shape share a subscription.

**Lifecycle.** `atomFamily` caches per key. When a shape is deleted, the entry stays in the cache until you evict it — call `shapeAtom.remove(id)` from the same command that removes the shape, otherwise the family leaks.

**Undo after delete reuses the id, not the atom.** Once the delete command has called `shapeAtom.remove(id)`, an undo that restores the same shape creates a _new_ atom on the next read. The canvas list (`splitAtom`) keys on atom identity, so the corresponding `ShapeRenderer` unmounts and remounts. The convention that makes this safe: **`ShapeRenderer` and any per-shape canvas component stays stateless.** If a future renderer needs local state (entrance animation, inline-edit cursor, hover-driven affordance), park that state in a separate id-keyed atom — not in React component state.

`shapeAtom` powers `selectedShapesAtom`; reach for it directly when you need keyed lookup outside the canvas list (e.g. a property panel bound to a single shape). The canvas list itself uses `splitAtom` (`shapeAtomsAtom`).

## State Categories: Project vs UI

Atoms in the store fall into two categories with different mutation rules:

**Project state** (`projectAtom`): the icons being edited, plus which one is active. Mutations must go through commands so they're undoable. Shape-level commands reach it through the `activeIconAtom` lens; icon-level commands (`src/store/commands/iconCommands.ts`) write the project directly.

**UI state** (`activeToolAtom`, `draftShapeAtom`, `resizeDraftAtom`, `moveDraftAtom`, `strokeColorSlotsAtom`, …): transient interaction state. Features may write these directly — no command, no history entry. UI state is **not** restored by undo/redo.

**Selection is the exception.** `selectedIdsAtom` is UI state by lifecycle (session-local, not persisted by export or save), but every effective change to it is itself a Figma-style Undo step — click shape A, then click shape B, then `Cmd+Z` restores the selection to A without touching the project. Selection therefore lives on the _same_ history stack as the project. The public `selectedIdsAtom` is read-only — its backing atom is module-private. The only write paths are `commitSelectionAtom` (normalising, used by `createCommand`) and `restoreSelectionAtom` (verbatim, used by undo/redo). This is a structural guarantee, not a convention. A `HistoryEntry` snapshots both axes (`before`/`after` for the project, `selectionBefore`/`selectionAfter` for selection); a _Selection-Command_ leaves the project axis untouched (`before === after`), a _Combined Command_ moves both atomically.

Consumers of selection still filter stale ids against the per-shape atoms as defense-in-depth (`selectedShapesAtom` already does this), but the primary mechanism that keeps selection consistent across history is the snapshot, not the filter.

If any other UI atom ever wants in on undo/redo, the bar is high: justify it against the principle that history's job is to roll back the _document_ and the _semantic context that drove each mutation_, nothing else.

## Stroke Data Semantics

Every shape carries optional `stroke` (color string) and `strokeWidth` (number) fields on the base schema. Their interplay:

- **`stroke` is the on/off switch.** An absent `stroke` field (or the defense-in-depth sentinel `'none'`) means "no stroke". Commands never write `'none'` — they delete the field.
- **`strokeWidth` persists independently.** Removing a stroke deletes `stroke` but keeps `strokeWidth` as memory for re-enable. A width without a color has no visual effect.
- **Adding a stroke** writes `stroke: '#000'` and, where no width exists yet, `strokeWidth: 2`. The color command (`setStrokeColorCommand`) activates stroke-less shapes — setting a color implicitly adds the stroke. The width command (`setStrokeWidthCommand`) does **not** activate — it only stores the remembered width.

### Selection-Stroke Atom

`selectionStrokeAtom` (`src/store/atoms/selection-stroke.ts`) derives a summary from the selected shapes:

| Field      | Value                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------- |
| `presence` | `'none'` / `'some'` / `'all'` — tri-state of how many selected shapes have an active stroke   |
| `color`    | The uniform stroke color, or `MIXED` when selected stroked shapes disagree                    |
| `width`    | The uniform stroke width among stroked shapes, or `MIXED` (a missing width counts as `MIXED`) |

The Stroke Section reads this atom to decide header actions ("+"/"-") and control visibility.

### Color Slots

`strokeColorSlotsAtom` (factory: `createColorSlotsAtom` in `src/store/atoms/colorSlots.ts`) holds ten color slots: slot 1 starts as `#000000`, the rest empty. **Color Slots are session-local UI state** — written directly, not through commands, not undoable, not persisted. After undo the shape color reverts but the slots keep their colors, by design.

The factory is color-agnostic: it takes an optional initial-state array (defaults to slot 1 = `#000000`, rest empty). A future fill picker can instantiate its own slots with `createColorSlotsAtom(['#000000', null, null, null, null, null, null, null, null, null])` without sharing stroke state.
