# Glossary

Shared vocabulary for the Mozaicon project, grouped by topic. Entries are **definition + boundary only** — mechanics live in the thematic docs and the code. Data-model terms are also defined as Zod schemas in `src/types/`.

## Project

**Project** — The top-level container holding many _Icons_: `{ id, icons, activeIconId, nextIconNumber }`, one in-memory project per session in `projectAtom` (the single Immer root). `nextIconNumber` is a monotonic default-name counter — never reused after a delete. See [`state.md`](./state.md).

**Icon** — One designable unit `{ id, name, viewBox, shapes }`; each icon keeps its own viewBox, and the `name` drives the export filename. Formerly _Document_ (term retired).

**Active Icon** — The icon currently projected onto the canvas (`project.activeIconId`), read and written through the `activeIconAtom` lens. Switching it clears the selection as one combined _History Entry_ (Figma page-switch model).

**Document** — Retired term; where it still appears, read it as "the active icon".

## Canvas

**Canvas** — The `<svg>` element rendered by `CanvasStage`, 1:1 with the icon coordinate system. Boundary: the _Artboard_ frames it; the _Icon_ is the data it projects. See [`canvas-chrome.md`](./canvas-chrome.md).

**Artboard** — The gesture-origin surface: a `<div>` wrapper that frames the Canvas and owns the tool lifecycle, pointer bridge, and pointer capture; a press anywhere inside (including the padding ring) begins a background gesture. Boundary: _Canvas_ (the `<svg>` it wraps) and _Page_ (the surrounding app chrome). See [`canvas-chrome.md`](./canvas-chrome.md).

**Pixel Grid** — The integer-position dot overlay rendered as the deepest layer inside the Canvas; a spatial reference only — not part of the document model, never exported. See [`canvas-chrome.md`](./canvas-chrome.md).

## Rendering

**Element Tree** — The single icon-to-SVG translation layer (`iconElements` / `shapeToElement` in `src/lib/svg/shapeElement.ts`), consumed by the canvas printer and both export printers. Adding a shape type touches the tree once, never the printers. See [`export.md`](./export.md).

## Interaction

**Gesture** — A transient, draft-sourced interaction with a `null → populated → null` draft lifecycle; pointer-driven (Drag-to-Draw, Drag-to-Select, Drag-to-Move, Resize) or keyboard-driven (Nudge). Non-gestures: tool switches, hover affordances, overlay visuals. See [`gestures.md`](./gestures.md).

**Gesture Registry** — The ordered list of _Gesture Adapters_ (`src/store/atoms/gestures/registry.ts`); list position determines display-bbox precedence. See [`gestures.md`](./gestures.md).

**Drag-to-Draw** — Creating a new shape by press-drag-release; start and end point determine the geometry. Distinct from _Drag-to-Move_ (translates) and _Drag-to-Select_ (selects). See [`shapes.md`](./shapes.md) § Drawing Tools.

**Drag-to-Select** — The marquee gesture from a background pointerdown while no draw tool is active; commits replace (or Shift: symmetric-difference) selection on pointerup. See [`gestures.md`](./gestures.md).

**Drag-to-Move** — Translating the selected shapes by dragging one of them; the _Move Set_ is captured at promotion, one `moveSelectionCommand` commits on pointerup. See [`gestures.md`](./gestures.md).

**Layer Reorder** — Changing z-order via the Layers panel: _Drag-to-Reorder_ plus the four Z-order shortcuts. Panel top = front = last array index; not a registry gesture. See [`commands.md`](./commands.md) § Layer Reorder.

**Drag-to-Reorder** — The pointer sub-interaction of _Layer Reorder_: drop a layer row at a new gap; a selection moves as one contiguous block, a single `moveShapeBlockCommand` commits on drop.

**Click-Fallback** — What a sub-threshold (< 3 screen px) pointer down/up does instead of the gesture: draw inserts a default-size shape, select clears (Shift: no-op), move runs click-to-select semantics. See [`gestures.md`](./gestures.md).

**Nudge** — The keyboard translation gesture via arrow keys; accumulates across auto-repeat and commits one `moveSelectionCommand` on key-up. Distinct from _Drag-to-Move_ (pointer-driven). See [`gestures.md`](./gestures.md).

**Translation Gesture** — A gesture translating shapes by a uniform `{ dx, dy }`, produced by the `createTranslationGesture` factory; _Drag-to-Move_ and _Nudge_ are its two instances. Distinct from gestures producing per-shape geometry or a selection (Resize, Draw, Marquee). See [`gestures.md`](./gestures.md).

**Translation Draft** — The shared transient type `{ ids, dx, dy } | null` held by every _Translation Gesture_'s draft atom; `ids` is frozen at gesture start.

**Move Draft / Nudge Draft** — See _Translation Draft_ (`moveDraftAtom` / `nudgeDraftAtom`).

**Gesture Sampler** — The per-gesture helper (`createGestureSampler`) that caches the screen-to-viewBox CTM once and frame-throttles draft writes to ≤1 per animation frame. See [`gestures.md`](./gestures.md).

## Geometry

**Rect** — Axis-aligned rectangle `{ x, y, width, height }` in viewBox units (`src/lib/geometry/rect.ts`). Distinct from `RectShape`, which is a _Rect_ plus style and identity.

**Bbox** — The smallest _Rect_ enclosing a shape's rendered geometry (`bboxOf`); deliberately geometry-only — excludes stroke width and transforms. Selection overlay, resize handles, and marquee hit-test all use this geometry-only bbox; click selection picks up painted strokes natively via pointer events, so no visual-bounds bbox is needed.

**Selection bbox** — The union of the _Bbox_ of every selected shape (`bboxOfMany`), or `null` when empty; the anchor for selection-bound visuals.

**Resize Handle** — One of 8 circles around the _Selection bbox_ (4 corners, 4 edge midpoints), screen-size-constant at every zoom. See [`gestures.md`](./gestures.md) § Resize.

**Resize Anchor** — The point diametrically opposite the dragged _Resize Handle_; stays fixed during the resize.

**Resize Draft** — Transient per-shape geometry (`Record<id, Rect> | null`) in `resizeDraftAtom`; one `resizeShapeCommand` commits on pointerup. See [`gestures.md`](./gestures.md).

**Move Set** — The subset of the selection that actually translates in a _Drag-to-Move_: selected ∩ _Selectable Shapes_, frozen at promotion. An empty Move Set blocks promotion.

## Stroke

**Stroke Section** — The properties-panel section (`StrokeSection.tsx`) for stroke editing, visible when the selection is non-empty. Exposes a presence tri-state derived from the selection: `none` (no selected shape has a stroke — header shows "+"), `some` or `all` (controls visible, header shows "−"). See [`state.md`](./state.md) § Selection-Stroke Atom.

**Color Slots** — A row of six session-local color swatches in the _Stroke Section_, backed by `strokeColorSlotsAtom`. Three click modes: empty slot opens the native picker, filled inactive slot applies that color, filled active slot reopens the picker. Slot state is UI state — not undoable, not persisted. Built color-agnostically (`createColorSlotsAtom`) so a future fill picker can reuse the same factory. See [`state.md`](./state.md) § Color Slots.

**Stroke Preview Draft** — A paint-merging gesture draft (`strokePreviewDraftAtom`) holding per-shape `StrokePaintOverride` entries (optional `stroke` and/or `strokeWidth`). Unlike geometry drafts (Translation, Resize), the renderer merges paint attributes rather than geometry. Registered in the _Gesture Registry_ with `blocksCommands: false` so commands can commit while the draft is active (the native picker's final `change` event clears the draft, then dispatches the command). See [`gestures.md`](./gestures.md) § Stroke Preview Draft.

## Corners

**Corner Style** — The interpolation mode for a rect's corners: `'rounded'` (circular arcs) or `'smooth'` (superellipse Béziers), stored in `corners.style`; drives the rect-vs-path routing. Distinct from `radii`, which controls corner size. See [`shapes.md`](./shapes.md).

**Smoothing** — A 0–100 blend factor from circular arc toward a full superellipse quadrant; only effective when the _Corner Style_ is `'smooth'`.

**Squircle** — A rect with _Corner Style_ `'smooth'` and _Smoothing_ > 0 — a rendering mode of `rect`, not a distinct shape type.

**Corners Section** — The properties-panel section (`CornersSection.tsx`) grouping radius, _Corner Style_, and _Smoothing_ controls; shows MIXED when a multi-selection disagrees.

## Selection

**Selection** — The set of selected shape IDs in `selectedIdsAtom`: deduplicated, z-order-sorted, session-local; every effective change is one _History Entry_. Distinct from _Selection bbox_ (the geometric envelope). See [`state.md`](./state.md).

**Selectable Shape** — A shape qualifying for user-driven selection: `visible && !locked`. Both marquee and click selection consult this predicate; programmatic selection bypasses it.

**Marquee Draft** — Transient marquee state in `marqueeDraftAtom` during a _Drag-to-Select_; the selection commits only on pointerup. See [`gestures.md`](./gestures.md).

**Selection-Command** — A command returning a new `selection` but no `icon`; its _History Entry_ leaves the project axis untouched. Distinct from a _Combined Command_.

**Combined Command** — A command returning both `icon` and `selection` in one atomic _History Entry_ (e.g. `addShapeCommand`); one undo press reverts both axes. See [`commands.md`](./commands.md).

## Export

**Direct-Download Export** — Every export button is click = file download — no format toggle, preview, or clipboard step. The dispatch seam is `performExport(doc, target)`. See [`export.md`](./export.md).

**PNG Scale** — A viewBox multiple used as the raster size (1x/2x/4x); the filename carries the suffix (`icon@2x.png`). See [`export.md`](./export.md).

**Sticky Export Target** — The last-triggered export format (`exportTargetAtom`), re-triggered by Mod+Shift+E; session-local and project-global. See [`export.md`](./export.md).

**Export Parity** — The invariant that exported output renders identically to the canvas content minus editor chrome, and that SVG and TSX are structurally identical. See [`export.md`](./export.md).

## Fields

**NumberInput** — The labeled numeric property field (`src/components/NumberInput.tsx`) with a draft-then-commit buffer: one `onCommit` on Enter/blur, optional `onChange` for live preview, modifier-stepped arrows (Shift ×10, Alt fine). Value-neutral — knows nothing about shapes or commands.

## History

**History Entry** — One record on the undo/redo stack: `label`, `before`/`after` `Project` snapshots, `selectionBefore`/`selectionAfter`. Covers both axes so selection rides on the same timeline as project edits. See [`state.md`](./state.md).

**Active Gesture** — A _Gesture_ whose draft atom is non-null. While one runs, all commands and undo/redo freeze; Escape cancels (a separate mechanism from undo). See [`gestures.md`](./gestures.md).
