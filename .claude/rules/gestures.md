---
paths:
  - 'src/store/atoms/gestures/**'
  - 'src/features/canvas/**'
---

# Gestures

Read @docs/gestures.md before touching gesture code — registry, drafts,
samplers, and per-gesture mechanics in full.

## Non-negotiables

- **Draft-then-commit.** Pointer/key moves write the transient draft atom;
  exactly one command commits on `pointerup` / key-up. Never dispatch
  commands per frame.
- **Active Gesture iff draft atom is non-null.** The draft lifecycle is
  `null → populated → null`; at most one adapter is active at any time.
- **Commands freeze during a gesture.** Every dispatch no-ops while
  `isAnyGestureActiveAtom` is true. Don't work around the freeze — commit
  on gesture end instead.
- **New gestures go through the registry.** Write a `GestureAdapter` (draft
  atom + optional `displayBbox`) and insert it at the correct precedence
  position in `src/store/atoms/gestures/registry.ts`. Translation gestures
  use the `createTranslationGesture` factory.
- **The gesture set is frozen at promotion.** Renderers and `displayBbox`
  key off `draft.ids`, never `selectedIdsAtom`.
- **Paint-merging drafts override paint, not geometry.** The stroke preview
  adapter (`strokePreviewAdapter`) uses `blocksCommands: false` — commands
  can commit while the draft is active. The close handler (Color Picker
  deliberate close) must clear the draft before dispatching the command so
  the undo step is clean.
