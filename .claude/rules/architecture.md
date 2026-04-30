---
paths:
  - 'src/store/**'
  - 'src/features/canvas/**'
---

# Store & Canvas Architecture

Read @docs/architecture.md before non-trivial changes here. It covers the
command pattern, atom design, and the rendering pipeline in full.

## Non-negotiables

- **All mutations go through commands.** Never call `set` on a primitive atom
  from a component. Dispatch via command atoms in `src/store/commands/`. Undo
  and redo depend on this — bypassing it silently breaks history.
- **Use the `createCommand` helper.** Don't write raw write-only atoms.
- **Every command needs tests:** at least one happy path and one no-op case.
- **Never manipulate the SVG DOM imperatively.** No `ref.current.setAttribute`,
  no direct mutation. The DOM is a pure projection of atom state.

## Atom design

- Prefer many small, focused atoms over one large one. If a component
  re-renders when a sibling's data changes, the atom is too coarse — split it.
- **`atomFamily`** for per-shape atoms (property editors, fine-grained
  subscriptions).
- **`splitAtom`** for list rendering on the canvas — each child subscribes
  only to its own atom.
- **Derived atoms** (`atom((get) => ...)`) for computed state. Don't
  recompute in components.
- **`atomWithImmer`** for atoms holding deep structures (the document tree).
- Selection lives in its own atom, never inside shape data.

## Debugging

- Inspect the `<svg>` element in devtools — it reflects atom state 1:1.
- Enable `<DevTools />` from `jotai-devtools` to watch atom values and updates.
- React Profiler shows unnecessary re-renders → usually a too-coarse atom.
