# Canvas Chrome

Static visual scaffolding around and inside the canvas. Gesture-driven overlays (selection, marquee, draft shapes) live in [`gestures.md`](./gestures.md).

## Surface Hierarchy

The canvas area is a three-layer surface stack, outermost in:

```
┌── Page (bg-muted) ─────────────────────────┐
│                                             │
│  ┌── Artboard (bg-card, rounded-xl) ────────┐
│  │  padding                                 │
│  │  ┌── Canvas (bg-card, <svg>) ──────────┐ │
│  │  │  viewBox = document.viewBox         │ │
│  │  │  1:1 with icon coordinate system    │ │
│  │  └─────────────────────────────────────┘ │
│  └──────────────────────────────────────────┘
│                                             │
└─────────────────────────────────────────────┘
```

| Layer        | Element | Surface token | Role                                                        |
| ------------ | ------- | ------------- | ----------------------------------------------------------- |
| **Page**     | `<div>` | `bg-muted`    | App background, muted neutral.                              |
| **Artboard** | `<div>` | `bg-card`     | Frames the canvas with padding; same surface as the canvas. |
| **Canvas**   | `<svg>` | `bg-card`     | The work area; shares the Artboard's surface.               |

Artboard and Canvas share `bg-card` and read as one raised surface; the surrounding Page (`bg-muted`) sets it off. The single brightness step muted → card frames the work area — no border or shadow is needed.

## Artboard

`src/features/canvas/Artboard.tsx`

The gesture-origin surface. A `<div>` that frames the canvas with padding and owns the tool lifecycle, pointer bridge, pointer capture, and the active tool's cursor class. A pointer press anywhere inside the Artboard — including the padding ring — begins a background gesture: Drag-to-Draw when a draw tool is active, Drag-to-Select (marquee) when no tool is active. Coordinates map through the canvas CTM (`screenToViewBox`) and are used unclamped; out-of-viewBox values in the padding produce off-canvas geometry, consistent with resize and move.

```
bg-card  rounded-xl  p-[calc(512px/24)]  cursor class from active tool
```

- **`bg-card`** — the same surface as the canvas `<svg>`, so the frame and the canvas read as one continuous raised surface against the `bg-muted` page.
- **`rounded-xl`** (10px) — the only DS-sanctioned use of this radius token. See [`design-tokens.md`](./design-tokens.md) → Radii.
- No border, no shadow.
- **Cursor class** — applied to the Artboard div so it covers the padding; the canvas SVG inherits it. `cursor-move` during a move gesture wins over the tool cursor.

The Artboard creates the canvas ref and renders `CanvasStage` as its child, threading the ref as a prop. `CanvasStage` is a pure renderer of the `<svg>` and its layers — it owns no bridge, no tool lookup, and no cursor class.

The app shell mounts it in `App.tsx`:

```tsx
<Artboard />
```

## Pixel Grid

`src/features/canvas/PixelGrid.tsx`

A muted dot at every integer position within the document viewBox, rendered as the deepest layer inside the `<svg>`. Shapes with opaque fills occlude the dots; transparent fills let them show through. The grid is a spatial reference, not data — it has no effect on the document model or export.

### Implementation

One SVG `<pattern>` (a single `<circle>` at the tile center, `r=0.09` viewBox units, `currentColor`) tiled across one covering `<rect>`. The DOM is two elements regardless of viewBox dimensions — O(1) nodes.

```
<g class="text-foreground/25" pointer-events="none">
  <defs>
    <pattern id="pixel-grid" x="-0.5" y="-0.5" width="1" height="1" patternUnits="userSpaceOnUse">
      <circle cx="0.5" cy="0.5" r="0.09" fill="currentColor" />
    </pattern>
  </defs>
  <rect x="minX - 0.25" y="minY - 0.25"
        width="width + 0.5" height="height + 0.5"
        fill="url(#pixel-grid)" />
</g>
```

### Edge handling

The pattern tile is offset by `(-0.5, -0.5)` and the circle sits at the tile center, so each dot lands exactly on an integer position while staying fully inside its tile — no clipping, no `overflow` override needed on the pattern. The covering rect extends 0.25 units past the viewBox in each direction so the edge-row and edge-column tiles are still instantiated and their dots painted. The canvas SVG carries `overflow="visible"` so dots sitting on the viewBox boundary render in full, spilling ~1px into the Artboard padding.

### viewBox subscription

The grid reads the document viewBox through the shared `viewBoxAtom` (`store/atoms/canvas.ts`), a focused `selectAtom` isolated from CanvasStage's other state. No custom comparator is needed: Immer keeps the `viewBox` array referentially stable across unrelated document mutations, so `selectAtom`'s default `Object.is` already suppresses spurious re-renders.

### Color

`text-foreground/25` inherited via `currentColor`. Works in both light and dark mode without per-theme overrides.

### Pattern id

The `<pattern>`'s DOM id is generated per instance with React's `useId()` (shown as a literal `pixel-grid` in the sample above for readability), so multiple canvas instances — Storybook isolation, a future split view — never collide on a shared id or have `url(#…)` resolve to the wrong pattern. The `data-testid="pixel-grid"` on the covering rect stays static for unit/e2e selection.

## Canvas-is-SVG Invariant

The Canvas is the `<svg>` element and is 1:1 with the icon coordinate system. Shape coordinates in the document model and shape coordinates in the DOM never diverge.

**Inside the SVG** (coordinate-space layers):

1. Pixel Grid (deepest, `pointer-events: none`)
2. Document shapes (via `splitAtom` / `ShapeRenderer`)
3. Gesture-driven draft and overlay layers (draft shape, hover highlight, marquee highlight, selection overlay, marquee overlay)

**Outside the SVG** (app-space chrome):

- Artboard (gesture-origin `<div>`, owns pointer bridge + cursor)
- Future chrome: rulers, zoom HUD, pixel inspector

Chrome that frames or annotates the canvas mounts as a sibling or ancestor of the `<svg>` under the Artboard — never inside it. This keeps the SVG a pure projection of the icon coordinate system.

### Stop-propagation invariant for interactive chrome

Because the Artboard is the gesture-origin surface, any interactive chrome mounted as a sibling of the `<svg>` inside the Artboard **must** call `e.stopPropagation()` on `pointerdown`. Without this, a click on chrome (a ruler grab handle, a zoom control) would bubble up to the Artboard and be misinterpreted as a canvas background gesture. Shapes and resize handles already follow this pattern — future chrome must do the same.

### `overflow="visible"` soft invariant

The canvas SVG sets `overflow="visible"` so Pixel Grid edge dots render in full. This means the canvas no longer acts as a hard clip rectangle for off-viewBox content. Several gesture flows do produce off-viewBox geometry — the marquee rect dragged past the edge, resize handles on edge-flush shapes, in-progress draw drafts, and padding-origin gestures (Drag-to-Draw or Drag-to-Select started in the Artboard padding) — and that geometry is intentionally left unclipped, spilling into the Artboard padding. Padding-origin coordinates map through the canvas CTM and are used unclamped. If a future feature needs hard clipping, apply a targeted `<clipPath>` on the affected layer rather than reverting `overflow`.

## Future Chrome

Placeholder for surfaces that annotate or frame the canvas without being part of the icon:

- **Rulers** — tick marks along the Artboard edges showing viewBox coordinates.
- **Zoom HUD** — current zoom level / viewport indicator.
- **Pixel inspector** — color and coordinate readout under the pointer.

All mount outside the `<svg>`, as siblings under the Artboard, respecting the Canvas-is-SVG invariant and the stop-propagation invariant (each must call `e.stopPropagation()` on `pointerdown`). Add documentation for each here as it lands.
