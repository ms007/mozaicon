---
paths:
  - 'src/features/canvas/**'
---

# Canvas Chrome

Read @docs/canvas-chrome.md before adding chrome around or inside the canvas.

## Non-negotiables

- **Canvas-is-SVG.** The `<svg>` is 1:1 with the icon coordinate system.
  Chrome that frames or annotates the canvas mounts outside the `<svg>` —
  as a sibling or ancestor under the Artboard — never inside it.
- **Interactive chrome stops propagation.** Any interactive element inside
  the Artboard but outside the `<svg>` must call `e.stopPropagation()` on
  `pointerdown`, or the press is misread as a canvas background gesture.
- **Don't revert `overflow="visible"`.** Off-viewBox gesture geometry spills
  into the Artboard padding on purpose. If a feature needs clipping, apply a
  targeted `<clipPath>` on that layer.
