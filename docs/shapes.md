# Shape System

This document explains how shapes work and how to add a new shape type.

## Overview

A **shape** is a single drawable element in the document. All shapes share a common base (`id`, `name`, `visible`, `locked`, and the paint fields `fill` / `stroke` / `strokeWidth`) and add type-specific geometry.

Shapes are stored as a **discriminated union** in `src/types/shapes.ts`, keyed on `type`. This gives us:

- Exhaustive pattern matching (TS will complain if you miss a case)
- Zod runtime validation on load/paste/import
- A single place to see every shape the app supports

## The Shape Contract

Every shape must support these operations:

| Operation     | Where                           | Required |
| ------------- | ------------------------------- | -------- |
| Schema        | `src/types/shapes.ts`           | Yes      |
| Element tree  | `src/lib/svg/shapeElement.ts`   | Yes      |
| Bounding box  | `src/lib/svg/bbox/`             | Yes      |
| Translate     | `src/lib/geometry/translate.ts` | Yes      |
| Scale         | `src/lib/geometry/scale.ts`     | Yes      |
| Properties UI | `src/features/properties/`      | Yes      |
| Drawing tool  | `src/features/toolbar/tools/`   | Optional |

If any of these is missing, `pnpm check` should fail via the exhaustiveness check (see "Exhaustiveness" below).

Hit testing needs no per-shape code: clicks land on the rendered SVG element via pointer events, and marquee selection intersects against the shape's bbox — both come for free once the element tree and bbox cases exist.

## Existing Shape Types

- **`rect`** — rectangle with a `corners` value object (see below). At render time the element seam (`chooseRectElement` in `src/lib/svg/rectElement.ts`) picks either a native `<rect>` or a `<path>` depending on the corners configuration. `DEFAULT_CORNERS` (all zeros, `rounded`, smoothing 0) is exported from the `corner-radius` module in `src/lib/geometry/`.

### The `corners` Value Object

Every rect carries a `corners` field with three sub-fields:

| Field       | Type                         | Description                                                                     |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `radii`     | `[tl, tr, br, bl]` (4-tuple) | Per-corner radius in viewBox units. Clamped to half the smaller side at render. |
| `style`     | `'rounded' \| 'smooth'`      | Corner interpolation mode. See _Corner Style_ in `docs/glossary.md`.            |
| `smoothing` | `0–100`                      | Superellipse blending factor; only takes effect when `style` is `'smooth'`.     |

Schema: `Corners` in `src/types/shapes.ts` (Zod). Types: `Corners`, `CornerStyle`, `Radii` via `z.infer<>`.

### Rect-vs-Path Routing

`chooseRectElement` decides which SVG element represents a rect on the canvas and in export:

| Condition                                    | Element  | Why                                                    |
| -------------------------------------------- | -------- | ------------------------------------------------------ |
| Uniform radii **and** style is `'rounded'`   | `<rect>` | Native `<rect rx>` is simpler and preserves semantics. |
| Non-uniform radii **or** style is `'smooth'` | `<path>` | Needs per-corner arcs or superellipse Bézier curves.   |

When the style is `'smooth'`, the smoothing value is forwarded to `cornerPath` to produce superellipse Bézier curves. When the style is `'rounded'`, smoothing is forced to 0 regardless of the stored value — switching from smooth back to rounded immediately produces arc-only corners. This routing is shared by the canvas renderer, the SVG export serializer, and the TSX codegen (via the element tree), so all three always agree on which element a rect becomes. See _Export Parity_ in `docs/export.md`.

## Adding a New Shape Type: Walkthrough

Let's add a `polygon` shape (N-point closed polyline).

### 1. Define the Schema

`src/types/shapes.ts`:

```ts
export const PolygonShape = ShapeBase.extend({
  type: z.literal('polygon'),
  points: z.array(Vec2).min(3), // at least a triangle
})

export const Shape = z.discriminatedUnion('type', [
  RectShape,
  PolygonShape, // <-- add here
])
```

That single addition to the union is what makes the exhaustiveness checks fire everywhere else. TypeScript will now yell at every `switch(shape.type)` that doesn't handle `polygon`. Walk through the compile errors — each one is a file you need to touch.

### 2. Add an Element Translation

`src/lib/svg/shapeElement.ts` — add a case to `shapeToElement`:

```ts
case 'polygon': {
  const points = shape.points.map((p) => `${p.x},${p.y}`).join(' ')
  const paint = shapePaintAttrs(shape)
  return { tag: 'polygon', attrs: { points, ...paint } }
}
```

The generic `ElementPrinter` in
`src/features/canvas/renderers/ElementPrinter.tsx` renders any
`ShapeElement` to JSX — no per-shape renderer component needed.
If your shape introduces a new SVG tag, add a case to the
`ElementPrinter` switch and extend the `ShapeElement` union.

### 3. Bounding Box

`src/lib/svg/bbox/bboxOf.ts`:

```ts
export function bboxOf(shape: Shape): Rect {
  switch (shape.type) {
    // ...
    case 'polygon': {
      const xs = shape.points.map((p) => p.x)
      const ys = shape.points.map((p) => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      }
    }
    default:
      return assertNever(shape)
  }
}
```

### 4. Translate (for Move commands)

`src/lib/geometry/translate.ts`:

```ts
export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.type) {
    // ...
    case 'polygon':
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      }
    default:
      return assertNever(shape)
  }
}
```

### 5. Properties Editor

`src/features/properties/PolygonEditor.tsx`:

```tsx
export function PolygonEditor({ shape }: { shape: Polygon }) {
  return (
    <>
      <PointsEditor points={shape.points} shapeId={shape.id} />
      <StyleEditor shape={shape} />
    </>
  )
}
```

Register in the editor switch (`PropertiesPanel.tsx`).

### 6. (Optional) Drawing Tool

If the shape is user-drawable, add a tool in `src/features/toolbar/tools/<name>.ts` and register it in `src/features/toolbar/tools/index.ts`. For drag-to-draw shapes, use the `createDragTool` factory (see [Drag-Tool Factory](#drag-tool-factory) below) — you only supply geometry math and a shape builder. See [Drawing Tools](#drawing-tools) for the full `DrawTool` interface and conventions.

### 7. Tests

At minimum, add:

- `src/types/shapes.test.ts` — schema validation (valid + invalid inputs)
- `src/lib/svg/bbox.test.ts` — bbox correctness
- `src/lib/geometry/translate.test.ts` — translate preserves invariants
- `src/lib/svg/shapeElement.test.ts` — element tree output (tag + attrs)

### 8. Verify

```bash
pnpm check
```

If anything's missing, TypeScript or the tests will flag it. **Don't suppress errors with `as any` or `@ts-ignore`** — they're the safety net.

## Drawing Tools

Tools live in `src/features/toolbar/tools/<name>.ts` and produce new shapes on the canvas. The first one to land is `rect` (Drag-to-Draw with click-fallback). Future tools (circle, line, ellipse, pen, polygon) plug into the same registry.

### Drag-Tool Factory

Any tool whose interaction model is "press → drag → release to commit a shape" should use the **`createDragTool`** factory in `src/features/toolbar/tools/createDragTool.ts`. The factory owns the entire drag-to-draw state machine — pointer tracking, click-vs-drag threshold, draft shape updates, commit, selection, and cleanup — so new tools only provide a `DragToolConfig` with:

- **`toolId`** — unique tool identifier (e.g. `'rect'`, `'ellipse'`)
- **`cursorClass`** — CSS cursor class applied while the tool is active
- **`geometryFromDrag`** — pure function mapping `(start, end, modifiers)` to shape geometry
- **`clickFallbackGeometry`** — default geometry for a click (no drag)
- **`geometryEquals`** — equality check used to skip no-op draft updates
- **`buildShape`** — converts geometry + style defaults into a shape payload

See `src/features/toolbar/tools/rect.ts` for a reference consumer. The factory's test suite (`createDragTool.test.ts`) documents the full lifecycle contract; the sections below describe the lifecycle concepts in detail.

### The `DrawTool` interface

```ts
type DrawTool = {
  id: string // 'rect'
  cursorClass: string // Tailwind cursor utility, e.g. 'cursor-crosshair'
  onPointerDown(ctx: ToolCtx, event: ToolEvent): void
  onPointerMove(ctx: ToolCtx, event: ToolEvent): void
  onPointerUp(ctx: ToolCtx, event: ToolEvent): void
  onDeactivate?(ctx: ToolCtx): void
  shouldHandlePointerMove?(ctx: ToolCtx): boolean
}

type ToolEvent = {
  point: Vec2 // viewBox units, unrounded
  screenPoint: Vec2 // raw client coordinates, used for the drag threshold
  modifiers: { shift: boolean; alt: boolean; meta: boolean; ctrl: boolean }
  pointerId: number
  buttons: number
}

type ToolCtx = {
  store: JotaiStore // read atoms, dispatch commands
  completeTool: () => void // signal "tool is done" — triggers one-shot deactivation
}
```

`CanvasStage` collects pointer events, converts to viewBox coordinates via `svg.getScreenCTM().inverse()`, looks up the active tool by `activeToolAtom`, and delegates. Tools never see DOM coordinates or refs.

### Drag-to-Draw lifecycle

The reference flow for `rect` (and any shape with rectangular bounds):

1. **`onPointerDown`** — write `activeDragAtom = { toolId, pointerId, start, modifiersAtStart }`. No draft yet, no command. `CanvasStage` calls `setPointerCapture` so the rest of the gesture lands on the SVG even when the cursor leaves the element.
2. **`onPointerMove`** —
   - Ignore events whose `pointerId` doesn't match `activeDrag.pointerId` (multi-pointer guard).
   - Compute the screen-space distance between down-point and current point against a **3-pixel threshold**.
   - Below threshold: do nothing.
   - At/above threshold: call the tool's `geometryFromDrag(start, point, modifiers)` and set `draftShapeAtom` to the resulting shape.
3. **`onPointerUp`** —
   - Below threshold → **Click-Fallback**: dispatch `addShapeCommand` with default geometry, anchor at the down-point as the top-left corner.
   - At/above threshold → dispatch `addShapeCommand` with the final draft geometry, clamped to a minimum of 1×1 viewBox unit per axis.
   - The tool generates the shape `id` and passes it in the command payload; `addShapeCommand` is a _Combined Command_ that selects the new shape in the same history entry (see _State Categories_ in `state.md` and `commands.md`).
   - Reset `draftShapeAtom = null` and `activeDragAtom = null`.

### Cancel triggers

A drag aborts (`draftShapeAtom = null`, `activeDragAtom = null`, no command, tool stays active) on:

- `pointercancel` (system interruption, touch cancel) — handler on `<svg>`.
- Escape — registered in the central shortcut system, not as a local listener.
- Active-tool change — an effect atom subscribed to `activeToolAtom`.

Right-click during an active drag preventDefaults the context menu but does **not** cancel. Drags only start on the primary button.

### Modifiers

Drag-to-Draw tools observe modifiers on every `pointermove`:

- **Shift** — constrain proportions (rect → square, line → 0/45/90).
- **Alt** — anchor at the center: down-point becomes the center, drag distance is the half-extent on each axis.
- **Shift + Alt** — combine (square from center).

Modifiers are re-evaluated each move; toggling mid-drag updates the draft live. Click-fallback ignores modifiers.

### `geometryFromDrag`

Each tool exports a pure `geometryFromDrag(start, end, modifiers)` that maps the drag vector to its shape-specific geometry, including normalization of negative drags. Test it like any `lib/` function — pure, no DOM, no atoms.

For rect:

```ts
export function geometryFromDrag(
  start: Vec2,
  end: Vec2,
  modifiers: Modifiers,
): { x: number; y: number; width: number; height: number } {
  let dx = end.x - start.x
  let dy = end.y - start.y

  if (modifiers.shift) {
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    dx = Math.sign(dx || 1) * size
    dy = Math.sign(dy || 1) * size
  }

  if (modifiers.alt) {
    return {
      x: start.x - Math.abs(dx),
      y: start.y - Math.abs(dy),
      width: Math.max(1, 2 * Math.abs(dx)),
      height: Math.max(1, 2 * Math.abs(dy)),
    }
  }

  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    width: Math.max(1, Math.abs(dx)),
    height: Math.max(1, Math.abs(dy)),
  }
}
```

### Draft rendering

`<DraftLayer>` in `src/features/canvas/` reads `draftShapeAtom` and renders it via the same `ShapeRenderer` switch as committed shapes — identical fill, stroke, everything. The draft is rendered **after** the document shapes so it sits on top in z-order. WYSIWYG: the user sees exactly what `pointerup` will commit.

### Tools that aren't drag-based

Pen / polygon / multi-click tools share the same registry, the same `ctx`, the same atoms — they just don't update `draftShapeAtom` on move. They use only `onPointerDown` and finish on Escape/Enter. Their per-tool in-progress state goes into a tool-local atom alongside `draftShapeAtom`.

## Exhaustiveness

We use an `assertNever` helper in every shape switch:

```ts
// src/lib/util/assertNever.ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`)
}
```

When you add a new shape type, every call site using `assertNever` becomes a compile error until you handle the new case. This is the **single most important guardrail** in the codebase — it's how we guarantee every shape supports every operation.

**Never cast away a `never` error.** If you see one after adding a shape type, that's TypeScript telling you exactly which file needs an update.

## Shape ID Strategy

- IDs are ULIDs (via the `ulid` package) — sortable, collision-resistant, URL-safe.
- IDs are generated **once** at creation time and never change, even across copy/paste or undo/redo.
- Groups reference children by id — never by index — so reordering is safe.

## Groups: A Special Case

Groups hold `childIds: string[]` and have no geometry. Their bbox is the union of child bboxes. When translating a group:

```ts
case 'group':
  // translate each child by (dx, dy), group itself doesn't move
  return shape;  // group's data doesn't change — children do
```

The group command fans out to child-move commands, batched into one history entry via `beginBatch` / `endBatch` (see `src/store/commands/batch.ts`).

## Anti-Patterns

- ❌ **Don't add type-specific fields to `ShapeBase`.** If only one shape needs it, put it on that shape.
- ❌ **Don't branch on `type` inside components.** Dispatch to a renderer component instead.
- ❌ **Don't mutate shape objects.** Always return new ones (Immer handles this inside commands).
- ❌ **Don't store derived data** (like bbox) in the shape. Compute it from geometry.
- ❌ **Don't skip the schema.** If a shape can exist at runtime, it must have a Zod schema — that's how we validate imports and pasted SVG.

## Importing External SVG

When users paste or import SVG, we parse with `DOMParser`, walk the tree, and convert each element into our shape union. Unknown elements become `path` shapes (we convert rects/ellipses to their path equivalent via `svgpath`). See `src/features/import/parseSvg.ts`.

This means: if you add a shape type that SVG doesn't natively have (e.g., `star`), you must also decide how it **exports** (likely as a `<path>`) and how it **imports** (likely stays as a `path` — we don't try to reverse-engineer stars from paths).
