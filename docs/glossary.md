# Glossary

Shared vocabulary for the Mozaicon project. Terms are grouped by topic. Data-model terms are also defined as Zod schemas in `src/types/`.

## Interaction

**Drag-to-Draw** — The gesture of creating a new shape on the canvas by pressing the pointer down, dragging, and releasing. Start and end point determine the shape's geometry (e.g. opposite corners of a rect). Distinct from _Drag-to-Move_ (translating an existing shape) and _Drag-to-Select_ (marquee selection).

**Click-Fallback** — In a _Drag-to-Draw_ tool, the result of a pointer down/up that does not exceed the drag threshold (3 screen pixels). Inserts a default-size shape at the click position with the click point as the top-left corner, instead of a zero-size shape from the drag.
