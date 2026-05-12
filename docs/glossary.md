# Glossary

Shared vocabulary for the Mozaicon project. Terms are grouped by topic. Data-model terms are also defined as Zod schemas in `src/types/`.

## Interaction

**Drag-to-Draw** — The gesture of creating a new shape on the canvas by pressing the pointer down, dragging, and releasing. Start and end point determine the shape's geometry (e.g. opposite corners of a rect). Distinct from _Drag-to-Move_ (translating an existing shape) and _Drag-to-Select_ (marquee selection).

**Click-Fallback** — In a _Drag-to-Draw_ tool, the result of a pointer down/up that does not exceed the drag threshold (3 screen pixels). Inserts a default-size shape at the click position with the click point as the top-left corner, instead of a zero-size shape from the drag.

## Geometry

**Rect** — Axis-aligned rectangle `{ x, y, width, height }` in viewBox units. The geometric primitive shared by _Bbox_ results, _Drag-to-Draw_ output, and (structurally) the geometry portion of a `RectShape`. Defined in `src/lib/geometry/rect.ts`. Distinct from `RectShape`, which is a _Rect_ plus style and identity.

**Bbox** — The smallest _Rect_ enclosing a shape's rendered geometry. Computed by `bboxOf(shape)` in `src/lib/svg/bbox/`. Excludes stroke width and transforms — those are presentation concerns, not geometry. Group bbox is the union of child bboxes (planned).

**Selection bbox** — The union of the _Bbox_ of every currently selected shape, or `null` when the selection is empty. Computed by `bboxOfMany(shapes)`. Rendered by `SelectionOverlay` and is the anchor for selection-bound visuals (_Resize Handles_, dimension labels, snap guides).

**Resize Handle** — One of 8 visible circles rendered around the _Selection bbox_: 4 at corners, 4 at edge midpoints. Each handle has a transparent hit-area sibling with double the visual radius. Visual radius is `4 / viewBoxScale` so handles stay the same screen size at every zoom level. Rendered by the `ResizeHandles` component inside `SelectionOverlay`. No gesture wired yet — visual affordance only.

**Resize Anchor** — The point diametrically opposite the _Resize Handle_ being dragged. During a resize gesture the anchor stays fixed while the dragged handle and adjacent edges move to follow the pointer. For corner handles the anchor is the opposite corner; for edge handles it is the opposite edge midpoint.

**Resize Draft** — Transient per-shape geometry (`Record<id, Rect> | null`) held in `resizeDraftAtom` during a resize gesture. `ShapeRenderer` reads draft entries with fallback to the document, so the gesture renders live without committing to the document. On `pointerup` the draft clears and a single undoable `resizeShapeCommand` commits the final geometry.

## History

**History Entry** — A record on the undo/redo stack capturing one command's effect. Fields: `label` (debug-only English string), `before` and `after` `Document` snapshots, plus `selectionBefore` and `selectionAfter` (`string[]`). Selection is the one UI atom included in the snapshot because the selected set is part of the semantic context of every mutation. Defined in `src/store/atoms/history.ts`.

**Active Gesture** — A pointer-driven interaction in progress (drag-to-draw, drag-to-move, resize), signalled by a non-null draft atom (`draftShapeAtom`, `resizeDraftAtom`, …) and surfaced via `isGestureActiveAtom`. While an _Active Gesture_ runs, history is frozen: `undoCommand` and `redoCommand` no-op and `canUndoAtom` / `canRedoAtom` report false, so the toolbar's undo/redo buttons grey out. The pending change isn't a `HistoryEntry` yet — it commits on `pointerup`. To cancel a gesture, use Escape (separate mechanism).
