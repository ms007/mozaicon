# Export

How the export feature works end to end: pipeline, formats, naming, and the sticky target.

## Pipeline

Every export flows through the same two-stage pipeline:

```
documentAtom → serialize (serializeDocument) → optimize (SVGO) → output
```

1. **Serialize** (`src/features/export/serialize.ts`) — prints the document's **element tree** (see below) as a raw SVG string with the document's `viewBox`. This is a pure function of the document model — no React, no atoms.
2. **Optimize** (`src/features/export/optimize.ts`) — passes the raw SVG through SVGO's `preset-default` for minification (collapsing groups, merging paths, stripping editor noise).

For PNG, the optimized SVG feeds into the **rasterizer** (`src/features/export/rasterize.ts`), which loads the SVG into an `Image`, draws it onto an off-screen `<canvas>` at the requested scale, and extracts a PNG `Blob` via `canvas.toBlob`.

For TSX, the **codegen** module (`src/features/export/codegen.ts`) prints the same element tree as a typed React function component (not through the SVG serializer or SVGO — TSX output is unoptimized). The component spreads `SVGProps<SVGSVGElement>` last so consumers can override attributes. Colors stay literal — no `currentColor` rewrite — to preserve Export Parity.

## Element Tree

`documentElements` (`src/lib/svg/shapeElement.ts`) is the single document-to-SVG translation: it filters to `visible` shapes and maps each to a `ShapeElement` — a tag plus a flat attribute record combining geometry (`chooseRectElement`) and paint (`shapePaintAttrs`, which applies the fill default and drops stroke attributes when stroke is unset or `none`). Attribute keys are camelCase; the XML printer in `serialize.ts` kebab-cases them (`strokeWidth` → `stroke-width`), the JSX printer in `codegen.ts` emits them as-is.

`serialize.ts` and `codegen.ts` are format printers only — adding a shape type touches the element tree once, never the printers.

## Export Parity

The invariant: **exported output renders identically to the canvas content, minus chrome.**

- Editor chrome (pixel grid, selection overlay, resize handles, artboard padding) never appears in output.
- Hidden shapes are excluded. Visible shapes serialize with their exact fill, stroke, and geometry.
- Shape `name`, `locked`, `visible`, and `id` fields are editor metadata and are stripped during serialization.
- The canvas renderers and the export printers share both the element-choice logic (`chooseRectElement` in `src/lib/svg/rectElement.ts`) and the paint logic (`shapePaintAttrs` in `src/lib/svg/shapeElement.ts`), so canvas and export cannot disagree about geometry or fill/stroke. Both export formats print the same element tree (`documentElements`), so they cannot disagree with each other either.

If a future feature adds a visual effect to the canvas (shadow, guides, snap indicators), it must be excluded from the serialization path to preserve this invariant.

## File-Naming Rules

All filenames derive from `documentAtom.name` via the naming module (`src/lib/naming.ts`).

| Format | Naming function         | Example (name = "Arrow Left") | Filename            |
| ------ | ----------------------- | ----------------------------- | ------------------- |
| SVG    | `toKebabSlug`           | `arrow-left`                  | `arrow-left.svg`    |
| TSX    | `toPascalComponentName` | `ArrowLeft`                   | `ArrowLeft.tsx`     |
| PNG 1x | `toKebabSlug`           | `arrow-left`                  | `arrow-left.png`    |
| PNG 2x | `toKebabSlug` + `@2x`   | `arrow-left`                  | `arrow-left@2x.png` |
| PNG 4x | `toKebabSlug` + `@4x`   | `arrow-left`                  | `arrow-left@4x.png` |

Edge cases handled by the naming functions:

- Empty or whitespace-only names fall back to `icon` (kebab) / `Icon` (Pascal).
- Leading digits in PascalCase get an `Icon` prefix (e.g. `3d-box` → `Icon3dBox`).
- Non-alphanumeric characters are stripped; consecutive hyphens collapse.

## Sticky Export Target

The **Sticky Export Target** (`exportTargetAtom` in `src/store/atoms/export.ts`) tracks the last format the user exported. It serves two purposes:

1. **Visual feedback** — the sticky target's button renders with the `primary` variant so the user can see at a glance which format they last used.
2. **Keyboard shortcut** — Mod+Shift+E re-triggers the sticky target without clicking, enabling rapid re-export during iteration.

The target defaults to `svg` and is session-local (not persisted across reloads). All five export buttons participate: `svg`, `tsx`, `png1x`, `png2x`, `png4x`. Clicking any button updates the sticky target and immediately downloads the file.

Export is disabled (all buttons greyed out) when the document has no visible shapes (`allExportDisabledAtom`). The shortcut no-ops in this state.

## Key Files

| File                                    | Role                                           |
| --------------------------------------- | ---------------------------------------------- |
| `src/features/export/ExportSection.tsx` | UI: five export buttons, sticky target styling |
| `src/features/export/performExport.ts`  | Shared dispatch: target → pipeline → download  |
| `src/lib/svg/shapeElement.ts`           | Element tree: document → `ShapeElement[]`      |
| `src/features/export/serialize.ts`      | XML printer: element tree → raw SVG string     |
| `src/features/export/optimize.ts`       | Stage 2: raw SVG → SVGO-optimized SVG          |
| `src/features/export/pipeline.ts`       | Combines serialize + optimize into `exportSvg` |
| `src/features/export/codegen.ts`        | JSX printer: element tree → React component    |
| `src/features/export/rasterize.ts`      | PNG: SVG string → Image → canvas → Blob        |
| `src/features/export/download.ts`       | File-saver wrappers for each format            |
| `src/features/export/bindings.ts`       | Mod+Shift+E shortcut binding                   |
| `src/store/atoms/export.ts`             | `exportTargetAtom`, `allExportDisabledAtom`    |
| `src/lib/naming.ts`                     | `toKebabSlug`, `toPascalComponentName`         |
