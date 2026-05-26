<div align="center">

# Mozaicon

**Pixel-perfect icon design with a keyboard-first workflow and instant SVG export.**

A browser-based app for designing, editing, and exporting SVG icons — draw shapes, manipulate paths, apply styles, and export optimized SVG.

[![CI](https://github.com/ms007/mozaicon/actions/workflows/ci.yml/badge.svg)](https://github.com/ms007/mozaicon/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## Highlights

- **Direct-manipulation canvas** — draw, marquee-select, drag-to-move, and resize shapes with live, sub-pixel feedback.
- **Keyboard-first** — every action has a shortcut; no menu-diving required.
- **First-class undo/redo** — even selection changes are undoable, Figma-style. Every mutation flows through a command.
- **Reactive by construction** — the `<svg>` DOM is a pure function of state; no imperative DOM mutation.
- **Strict, schema-first types** — shapes are Zod discriminated unions, validated at the edges.
- **Tested at every layer** — unit (Vitest), component (Testing Library), visual (Storybook), and e2e (Playwright).

## Tech Stack

| Concern      | Choice                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Build        | [Vite 8](https://vite.dev), [React 19](https://react.dev), TypeScript (strict)                 |
| UI           | [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com) via shadcn/ui |
| State        | [Jotai](https://jotai.org) + Immer (`jotai-immer`, `jotai-family`)                             |
| Canvas / SVG | Native SVG in JSX, `svgpath` for path math                                                     |
| Validation   | [Zod](https://zod.dev)                                                                         |
| Testing      | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev)                             |
| Workbench    | [Storybook 10](https://storybook.js.org)                                                       |

## Quick Start

> Requires **Node >= 22** and **[pnpm](https://pnpm.io)** (`packageManager: pnpm@11`).

```bash
pnpm install        # install dependencies
pnpm dev            # start the dev server at http://localhost:5173
```

That's it — open the printed URL and start drawing.

## Scripts

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `pnpm dev`             | Start the Vite dev server (port 5173)                   |
| `pnpm build`           | Type-check + production build                           |
| `pnpm preview`         | Preview the production build locally                    |
| `pnpm check`           | **The CI gate:** `tsc` + ESLint + Prettier + unit tests |
| `pnpm test`            | Vitest in watch mode                                    |
| `pnpm test:e2e`        | Playwright e2e + visual tests                           |
| `pnpm lint`            | ESLint with `--fix`                                     |
| `pnpm format`          | Prettier write                                          |
| `pnpm storybook`       | Storybook workbench (port 6006)                         |
| `pnpm build-storybook` | Build static Storybook                                  |

> **Run `pnpm check` before every commit** — it's the single source of truth for "does this pass CI".

## Architecture at a Glance

Mozaicon follows four guiding principles: **atomic state with derived views**, **all mutations through commands**, **React renders state** (never imperative DOM), and a **pure, React-free core** for geometry and SVG math.

```
┌─────────────────────────────────────────────┐
│  UI Layer (features/*)                      │
│  Canvas · Toolbar · Properties · Layers     │
│  Reads atoms, dispatches commands           │
├─────────────────────────────────────────────┤
│  Command Layer (store/commands/)            │
│  Write-only atoms · push onto history stack │
├─────────────────────────────────────────────┤
│  State Layer (store/atoms/)                 │
│  Primitive + derived atoms · atomFamily     │
├─────────────────────────────────────────────┤
│  Pure Core (lib/)                           │
│  Geometry · path math · SVG serialization   │
└─────────────────────────────────────────────┘
```

**Key concepts:**

- **Document** — the top-level SVG being edited (one per tab).
- **Shape** — a single element (`rect`, `circle`, `path`), each with a stable ULID.
- **Selection** — an array of shape IDs; multi-select is first-class and session-local, yet every change is an undo step.
- **Command** — every mutation, created via `createCommand`, so undo/redo just works.
- **Gesture** — a single pointer-down-to-up canvas interaction (draw, marquee, move, resize), each owning one draft atom and registered in the [Gesture Registry](docs/architecture.md).

## Project Structure

```
src/
  features/      # Feature slices (canvas, toolbar, properties, layers, shortcuts, export, storage)
  store/
    atoms/       # Primitive + derived atoms (document, selection, tool, history, gestures, …)
    commands/    # Undoable mutations via createCommand
  lib/           # Pure utilities, no React (geometry/, svg/, util/)
  components/
    primitives/  # Wrapper seam over shadcn — app code imports from here
    ui/          # Vendored shadcn (don't hand-edit, don't import directly)
  types/         # Shared TS types + Zod schemas
docs/            # Thematic deep-dives (see below)
e2e/             # Playwright specs
```

**Rule of thumb:** feature-specific code lives in `features/<name>/`; anything reused across features is promoted to `lib/` or `components/`.

## Testing

Test at the layer where the logic lives, smallest first:

- **`lib/` functions** → Vitest unit tests, co-located.
- **Components with logic** → Vitest + Testing Library.
- **Canvas / drag / export flows** → Playwright (`e2e/`).
- **SVG output** → golden-file snapshots of the serialized string.

```bash
pnpm check          # unit + lint + types + format (what CI runs)
pnpm test:e2e       # Playwright; add --headed to watch it drive the canvas
```

## Documentation

This README is the entry point. For non-trivial work, read the matching deep-dive:

| Doc                                              | Covers                                                   |
| ------------------------------------------------ | -------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)   | Atoms, the command pattern, gestures, rendering pipeline |
| [`docs/shapes.md`](docs/shapes.md)               | The shape model and how to add a new shape type          |
| [`docs/testing.md`](docs/testing.md)             | Test layers, golden-file conventions, Jotai helpers      |
| [`docs/ui-primitives.md`](docs/ui-primitives.md) | shadcn vendoring and the `primitives/` seam              |
| [`docs/design-tokens.md`](docs/design-tokens.md) | Theming and design tokens                                |
| [`docs/glossary.md`](docs/glossary.md)           | Shared project vocabulary                                |

`CLAUDE.md` holds the conventions and definition-of-done used by both humans and AI agents working in this repo.

## Contributing

1. Branch off `main`.
2. Make your change — keep files under ~300 lines, one component per file, tests co-located.
3. **All mutations go through commands**; never `set` primitive atoms from components.
4. Run `pnpm check` until green.
5. Open a PR — CI runs `pnpm check` and a Storybook build smoke check.

## License

MIT
