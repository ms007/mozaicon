---
paths:
  - 'src/features/export/**'
  - 'src/lib/svg/shapeElement.ts'
  - 'src/lib/svg/rectElement.ts'
  - 'src/lib/naming.ts'
---

# Export

Read @docs/export.md before changing the export pipeline — pipeline stages,
Export Parity, naming rules, and the Sticky Export Target in full.

## Non-negotiables

- **Export Parity.** Exported output renders identically to the canvas
  content, minus chrome. Canvas renderers and export printers share the
  element tree (`iconElements`, `chooseRectElement`, `shapePaintAttrs`) —
  never duplicate geometry or paint logic into a printer.
- **Printers stay shape-agnostic.** `serialize.ts` and `codegen.ts` are
  format printers only; adding a shape type touches the element tree once,
  never the printers.
- **Filenames derive from `src/lib/naming.ts`.** No ad-hoc slug or
  component-name logic.
- **SVGO's `convertShapeToPath` stays disabled.** A `<rect>` must stay a
  `<rect>` so canvas, SVG file, and TSX component stay structurally
  identical.
