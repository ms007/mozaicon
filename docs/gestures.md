# Gestures

How transient canvas interactions work: the registry, draft atoms, per-gesture mechanics, and cancellation. The commands that gestures commit are documented in [`commands.md`](./commands.md); drawing tools (Drag-to-Draw) have their own walkthrough in [`shapes.md`](./shapes.md) § Drawing Tools.

## What Is a Gesture

A **gesture** is a transient, draft-sourced interaction on the canvas with a `null → populated → null` lifecycle: the draft atom is `null` at rest, populated while the gesture is in flight, and cleared back to `null` on commit or cancel. Two kinds by input source:

- **Pointer Gestures** — driven by pointer-down-to-pointer-up, optionally promoted past a drag threshold: _Drag-to-Draw_, _Drag-to-Select_ (marquee), _Drag-to-Move_, and Resize.
- **Keyboard Gestures** — driven by key-down-to-key-up, optionally across auto-repeat: _Nudge_.

Both kinds share the same contract: one draft atom, one _Gesture Adapter_ in the _Gesture Registry_, the same `isAnyGestureActiveAtom` freeze.

**Non-gestures:** tool-mode switches (e.g. choosing the rect tool), hover affordances (cursor changes, handle highlights), and overlays that contribute additional visuals during a gesture (snap guides, smart-distance indicators). These may read gesture state but do not own a draft atom and are not entries in the registry. _Layer Reorder_ is also not a gesture — it is a standalone panel interaction that commits via ordinary commands and does not trigger the command freeze (see [`commands.md`](./commands.md) § Layer Reorder).

## Draft-then-Commit

Interactive gestures write a transient draft atom (`resizeDraftAtom`, `moveDraftAtom`, `draftShapeAtom`, …) on every sampled pointer move — these are UI state, not commands. A single undoable command fires on `pointerup` (or key-up for keyboard gestures). Per-frame commands are **not** the rule; they would flood the undo stack and thrash document snapshots. `ShapeRenderer` reads draft entries with fallback to the document, so the gesture renders live without mutating the document.

## Gesture Registry (`src/store/atoms/gestures/registry.ts`)

The gesture registry is the single source of truth for "which gestures exist and which is active". It is an ordered list of `GestureAdapter` objects — currently Marquee → Resize → Move → Nudge → Draw → PropertyStep → CornerRadiusStep → StrokePreview — each wrapping a draft atom and an optional `displayBbox` callback. The registry is input-source-agnostic: pointer-driven adapters (Marquee, Resize, Move, Draw) are driven by pointer-down-to-pointer-up; keyboard-driven adapters (Nudge) are driven by key-down-to-key-up across auto-repeat. Both kinds share the same `GestureAdapter` contract and contribute to the same derived atoms. The core invariant is **Active Gesture iff draft atom is non-null**: a gesture is in flight exactly when its adapter's draft atom holds a value, and at most one adapter is active at any time (pointer-driven hooks each own a single `dragRef` on shared `window` pointer events; the keyboard nudge handler is suppressed while a pointer gesture is active and vice versa). The at-most-one-active invariant is verified by a contract test in `registry.test.ts`.

Three derived atoms are computed from the registry:

- **`isAnyGestureActiveAtom`** — `true` iff any adapter's draft is non-null. Powers the command freeze in `createCommand`: while an _Active Gesture_ runs, every command dispatch — document, selection, combined — is a no-op. The freeze lives in `createCommand` itself, not only in `undoCommand` / `redoCommand`, so a stray background event (layers-panel click, `Cmd+A`, a programmatic selection write) cannot mutate state mid-drag.
- **`displayedSelectionBboxFromRegistryAtom`** — resolves what selection bbox to render by iterating adapters in precedence order. Each active adapter's `displayBbox` returns a `DisplayContribution`, a tagged union with three variants: `rect` (override with a concrete rect), `hide` (suppress the bbox entirely — returns `null`), `passThrough` (skip this adapter, continue to the next). If no adapter is active or all pass through, the atom falls back to `selectionBboxAtom`. Precedence order means Marquee's contribution always wins over Resize, Resize over Move, etc.
- **`cancelGesturesAtom`** — one write sets every adapter's draft to `null`. Safe because at most one gesture is active at any time — one Cancel covers them all.

Adding a new gesture — pointer-driven or keyboard-driven — means writing a `GestureAdapter` (draft atom + optional `displayBbox`) and inserting it at the correct precedence position in the registry list.

## Translation Gestures

Translation gestures translate selected shapes by a uniform `{ dx, dy }` delta and share a dedicated factory: `createTranslationGesture(name)` in `src/store/atoms/gestures/createTranslationGesture.ts`. It returns a complete `TranslationGesture` surface — draft atom (`TranslationDraft | null`), per-shape draft lookup (`draftForShapeAtom`, an `atomFamily` of `selectAtom` slices with structural `{ dx, dy }` equality), `isActiveAtom`, and a `GestureAdapter` whose `displayBbox` translates the bbox of the draft's frozen `ids`. Move and Nudge are both thin wrappers over this factory (`src/store/atoms/gestures/move.ts`, `src/store/atoms/gestures/nudge.ts`).

The **Translation Draft** is the shared transient type `{ ids: string[], dx: number, dy: number } | null`. `ShapeRenderer` applies the delta as a `<g transform="translate(dx,dy)">` wrapper for each shape in `ids`, giving live visual feedback without mutating the document. `ids` is the gesture's set (_Move Set_ / _Nudge Set_), captured at gesture start and intentionally frozen for the gesture's duration — the renderer and `displayBbox` key off `draft.ids`, never `selectedIdsAtom`. Selection changes from background events can't reach the gesture anyway while the command freeze is active, but the frozen set keeps that invariant explicit rather than incidental. On commit, the draft clears and the gesture dispatches one command — both current gestures commit via a single `moveSelectionCommand`.

Adding a translation gesture (e.g. paste-drag) takes three steps: call the factory, insert the adapter at the correct registry precedence position, and wire the new `draftForShapeAtom` into `ShapeRenderer` — the renderer subscribes to each translation gesture's per-shape lookup explicitly and sums the offsets; nothing self-wires. For non-translational gestures that produce per-shape geometry or a selection rather than a uniform delta (Resize, Draw, Marquee, PropertyStep), write a bespoke adapter directly — Resize and PropertyStep currently share an identical per-shape `Rect`-map shape and are candidates for a sibling factory when a third such gesture appears.

## Gesture Sampler (`src/lib/svg/gestureSampler.ts`)

A per-gesture plain object created by `createGestureSampler(svg, scheduler)`. It caches the inverse screen-to-viewBox CTM once at construction (a single forced layout read via `svg.getScreenCTM()`) and exposes three methods:

- `toViewBox(screenPoint)` — synchronous, DOM-free coordinate conversion.
- `schedule(screenPoint, modifiers, callback)` — coalesces pointer samples to at most one delivery per animation frame, carrying the latest modifier state (shift/alt).
- `stop()` — cancels any pending frame delivery.

The scheduler is injectable (`FrameScheduler` interface — `request` / `cancel`) so unit tests can drive delivery synchronously without timers. A _Gesture Adapter_ creates a Gesture Sampler at gesture start and calls `stop()` on `pointerup` or cancel; between those events, every `pointermove` calls `schedule()` instead of writing the draft atom directly, ensuring draft writes are frame-throttled (≤1 per frame). The cached CTM is valid for the gesture's duration under current-viewBox semantics (no zoom/pan mid-gesture); when zoom/pan support lands, the single invalidation seam is the constructor — create a new sampler with a fresh CTM.

## Per-Gesture Mechanics

All pointer gestures share the **3-screen-pixel drag threshold** (`DRAG_THRESHOLD_PX`): pointerdown installs a pending interaction, crossing the threshold promotes it into the gesture, a sub-threshold pointerup is the _Click-Fallback_ instead.

### Drag-to-Move

Pointerdown on a shape installs a pending interaction with a captured `startPoint`; crossing the threshold promotes it into a Drag-to-Move. At promotion the _Move Set_ is captured as the snapshot of the current selection filtered to _Selectable Shapes_ (`visible && !locked`); an empty Move Set blocks promotion — pointerdown on a lone locked shape cannot start a move. Pointerdown on a shape that is _not_ part of the current selection additionally dispatches `selectShapesCommand([id])` immediately before the first `moveDraftAtom` write, so the Move Set is the just-selected single shape — **the selection command must commit before `isGestureActiveAtom` flips to true**, otherwise the gesture freeze swallows it. Shift held during the drag axis-locks the delta to the dominant axis since `startPoint` (read per frame). On `pointerup` a single `moveSelectionCommand` commits the final `{ ids, dx, dy }` — one _History Entry_. Escape and pointercancel clear the draft, leaving the document at its pre-gesture value.

### Drag-to-Select (Marquee)

Started by a pointerdown on the canvas background while no draw tool is active. The draft (`marqueeDraftAtom`) holds `{ pointerId, startScreen, startViewBox, current, additive, baseSelection? }`. Hit-test is _Bbox_ intersection against the marquee rect, restricted to _Selectable Shapes_. Without Shift the gesture replaces the selection on `pointerup`; with Shift held at pointerdown it commits the symmetric difference against the _Base Selection_ snapshot — the modifier is captured once and stays fixed for the gesture's duration. A derived `previewSelectedIdsAtom` reads the draft to compute the hypothetical selection live; `SelectionOverlay` and the resize handles are suppressed while the draft is non-null, and `MarqueeOverlay` renders the rect. `selectedIdsAtom` stays untouched for the gesture's duration; on `pointerup` a single `selectShapesCommand` commits the final set — one _History Entry_. Escape and pointercancel clear the draft, leaving the selection at its pre-gesture value.

### Drag-to-Draw

Creating a new shape by press-drag-release; start and end point determine the geometry. The full lifecycle (tool factory, `geometryFromDrag`, modifiers, draft rendering, cancel triggers) is documented in [`shapes.md`](./shapes.md) § Drawing Tools.

### Nudge

The keyboard translation gesture. A key-down on an arrow key with a non-empty selection begins the gesture; subsequent arrow presses (including auto-repeat) accumulate into the running delta. The _Nudge Set_ is captured the same way as the _Move Set_: the current selection filtered to _Selectable Shapes_. On key-up (when all arrow keys are released) a single `moveSelectionCommand` commits the accumulated `{ ids, dx, dy }` — one _History Entry_ collapsing the entire arrow-key run. Escape clears the draft without committing. Suppressed when an editable element (input, textarea, contenteditable) has focus.

### Resize

Eight **Resize Handles** render around the selection bbox: 4 at corners, 4 at edge midpoints, each with a transparent hit-area sibling at double the visual radius; visual radius is `4 / viewBoxScale` so handles stay the same screen size at every zoom level (rendered by `ResizeHandles` inside `SelectionOverlay`). The **Resize Anchor** — the point diametrically opposite the dragged handle — stays fixed while the dragged handle and adjacent edges follow the pointer: opposite corner for corner handles, opposite edge midpoint for edge handles. The **Resize Draft** is transient per-shape geometry (`Record<id, Rect> | null`) in `resizeDraftAtom`; `ShapeRenderer` reads draft entries with fallback to the document. On `pointerup` the draft clears and a single undoable `resizeShapeCommand` commits the final geometry.

### Click-Fallback

What a sub-threshold pointer down/up does instead of the gesture:

| Pending gesture | Sub-threshold pointerup                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag-to-Draw    | Inserts a default-size shape with the click point as top-left corner                                                                                                                                                                                    |
| Drag-to-Select  | `clearSelectionCommand` without Shift; no-op with Shift                                                                                                                                                                                                 |
| Drag-to-Move    | Click-to-select semantics — `selectShapesCommand([id])` without Shift, `toggleSelectionCommand(id)` with Shift — deferred from pointerdown so an above-threshold drag on a multi-selection member doesn't collapse the selection before the move starts |

## Cancellation & Escape Priority

`Escape` is a priority ladder, evaluated in `bindings.ts` (`canvas.escape`) with **early return after the first matching tier**:

1. Active gesture → `cancelDraftAtom`, return. The pending change is not a _History Entry_ yet, so there is nothing to undo — only transient drafts to clear.
2. Active tool → deactivate (`activeToolAtom → null`), return.
3. Non-empty selection → `clearSelectionCommand`, return.

The ladder is "one step up" — Escape never reaches past the first tier that applies. Combining tiers in a single press (cancel _and_ clear selection together) is a regression: cancel means "return to the state before the gesture started", not "throw away gesture and selection in one stroke".

### Overlay Escape interception

Overlay primitives resolve Escape locally and must stop it before it reaches the `window`-level ladder. The _Color Picker_ popover is the first such case. While open it keeps the _Stroke Preview Draft_ populated, so tier 1 (active gesture) would otherwise fire on every Escape and revert without closing; instead the popover intercepts Escape (Radix `onEscapeKeyDown`) and calls `stopPropagation()`, resolving it in two local steps:

1. Hex field with an uncommitted buffer → discard the buffer (NumberInput semantics), keep the popover open.
2. Otherwise → close the popover and discard the preview draft (revert to the color before opening), without committing.

Because the event never reaches `window`, the central ladder's tool-deactivate and clear-selection tiers stay untouched — closing a picker never doubles as deactivating the active tool.

## Paint-Merging Drafts

All drafts described above merge **geometry** — they override a shape's position or size while the gesture is in flight. A paint-merging draft instead overrides **paint attributes** (stroke color and/or stroke width), leaving geometry untouched. The renderer merges paint entries from the draft over the shape's stored attributes in `ShapeRenderer`.

### Stroke Preview Draft

The first paint-merging draft: `strokePreviewDraftAtom` in `src/store/atoms/gestures/strokePreview.ts`. It holds `Record<string, StrokePaintOverride> | null`, where `StrokePaintOverride` is `{ stroke?: string; strokeWidth?: number }`. Per-shape lookup is `strokePreviewDraftForShapeAtom` (an `atomFamily` of `selectAtom` slices with structural equality).

**`blocksCommands: false`.** Unlike geometry drafts, the stroke preview adapter does _not_ freeze commands. This is deliberate: deliberately closing the _Color Picker_ must (1) clear the draft, then (2) dispatch the `setStrokeColorCommand` — both in the same synchronous turn. If the adapter blocked commands, step 2 would no-op. The close handler clears the draft first so `isAnyGestureActiveAtom` flips back to `false` before the command dispatches. This ordering produces exactly one undo step per picker session.

Two consumers write this draft:

- **Color Picker** (`previewStrokeColor`): the picker keeps the draft populated for its whole open session — pad, hue, and hex edits write only the draft (color override per selected shape). A deliberate close (outside-click, confirm, re-click of the active slot) clears the draft + commits one `setStrokeColorCommand`; Escape clears without committing (revert).
- **Width arrow stepping** (`previewStrokeWidth`): each arrow press writes a width override into the draft; Enter/blur clears + commits one `setStrokeWidthCommand`. Escape clears without committing.
