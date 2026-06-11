**Mozaicon** — a browser-based web app for designing, editing, and exporting SVG icons. Users can draw shapes, manipulate paths, apply styles, and export optimized SVG files.

**Core value prop:** Pixel-perfect icon design with keyboard-first workflow and instant SVG export.

## Required Reading

This file is the entry point. For non-trivial changes, read the matching deep-dive. Path-scoped rules in `.claude/rules/` (via `paths:` frontmatter) auto-load each subtree's non-negotiable invariants plus a pointer to its owning doc when you work there — they are a safety net, not a substitute for reading the doc:

- **`docs/architecture.md`** — system overview: layers, rendering pipeline, persistence, performance
- **`docs/state.md`** — data model (Zod schemas), atom graph, Project-vs-UI state categories
- **`docs/commands.md`** — command pattern, undo/redo, layer reorder
- **`docs/gestures.md`** — gesture registry, drafts, translation gestures, Escape priority
- **`docs/canvas-chrome.md`** — surface hierarchy, Artboard, Pixel Grid, Canvas-is-SVG invariant
- **`docs/shapes.md`** — shape model and how to add a new shape type
- **`docs/testing.md`** — test layers, golden-file conventions, Jotai test helpers
- **`docs/ui-primitives.md`** — shadcn vendoring and the `primitives/` wrapper seam
- **`docs/export.md`** — export pipeline, Export Parity invariant, naming rules, Sticky Export Target

## Tech Stack

- **Build:** Vite 8, React 19, TypeScript strict
- **UI:** Tailwind CSS v4, Radix UI via shadcn/ui
- **State:** Jotai + Immer (`jotai-immer`)
- **Canvas/SVG:** Native SVG in JSX, `svgpath` for path math
- **Storage/Export:** Dexie (IndexedDB), SVGO, `file-saver`
- **Testing:** Vitest, Playwright (e2e + visual)
- **Workbench:** Storybook 10

## Commands

```bash
pnpm dev              # Start dev server (Vite, port 5173)
pnpm build            # Type-check + production build
pnpm check            # Run tsc + eslint + prettier + vitest (use this before committing)
pnpm test             # Vitest watch mode
pnpm test:e2e         # Playwright tests
pnpm lint             # ESLint with --fix
pnpm format           # Prettier write
pnpm storybook        # Start Storybook on port 6006
pnpm build-storybook  # Build static Storybook
```

**Always run `pnpm check` after making changes.** It's the single source of truth for "does this pass CI".

## Key Concepts

- **Project:** The top-level container holding many icons. One in-memory project per session (`projectAtom`).
- **Icon:** One designable SVG — name, viewBox, shapes. Formerly "Document" (term retired). The **active icon** is what the canvas edits, accessed via the `activeIconAtom` lens.
- **Shape:** A single element (rect, circle, path, group). Each has a stable `id`.
- **Selection:** Array of shape IDs. Multi-select is first-class.
- **Command:** Every mutation goes through a command (for undo/redo). See `src/store/commands/`.

## Folder Structure

```
src/
  features/         # Feature slices (canvas, toolbar, properties, layers, shortcuts, export, storage)
  store/            # Jotai state
    atoms/          # Primitive + derived atoms (project, selection, tool, history, draft, …)
    commands/       # Undoable mutations via createCommand
    hooks/          # Composed hooks (reserved)
  lib/              # Pure utilities, no React (svg/, geometry/, util/, ids, utils)
  components/       # App-level components
    primitives/     # Wrapper seam over shadcn — import from here
    ui/             # Vendored shadcn (don't hand-edit, don't import directly)
  types/            # Shared TS types + Zod schemas
```

**Rule of thumb:** If it's specific to a feature, put it in `features/<name>/`. If it's reused across features, promote it to `lib/` or `components/`.

## Conventions

### TypeScript

- **Strict mode is on.** No `any`, no `@ts-ignore` without a comment explaining why.
- **Schemas first:** Define Zod schemas in `src/types/`, derive TS types via `z.infer<>`.
- **Discriminated unions for shapes:** Always check `shape.type` before accessing type-specific fields.

### React

- For atoms, prefer `useAtom(xAtom)` / `useAtomValue(xAtom)` directly in components — don't wrap every atom in a custom hook.
- Don't prop-drill — read from atoms.
- Memoize only when profiled, not preemptively.

### State

- **All mutations via commands.** Don't call `set` on primitive atoms from components — dispatch via command atoms in `store/commands/` (use `createCommand`).
- **Small atoms, derived views.** Prefer many focused atoms + `atom((get) => …)` for computed state over one big atom.
- **Selection is session-local but goes through commands.** Don't embed selection in shape data, and don't `set(selectedIdsAtom, …)` directly from features — dispatch `selectShapesCommand` / `toggleSelectionCommand` / `clearSelectionCommand`. Selection is a first-class undo step (PRD #119). Details → `docs/state.md` (Selection Atom) + `docs/commands.md`.

Details (atomFamily, splitAtom, atomWithImmer) → `docs/state.md`; command internals → `docs/commands.md`.

### Files

- **Keep files under 300 lines.** Split by responsibility when they grow.
- **One component per file.** Name file same as component (`ShapeInspector.tsx`).
- **Co-locate tests:** `Foo.tsx` + `Foo.test.tsx` in the same folder.
- **Docs follow the same budget.** Keep each `docs/*.md` under ~350 lines; when one outgrows it, split by subsystem and add the new doc to Required Reading. Don't restate a doc's content here — CLAUDE.md holds rules and pointers only.
- **Rules mirror docs.** Each `.claude/rules/*.md` holds only the non-negotiable invariants for its `paths:` scope plus a pointer to the owning doc — never doc content. When an invariant changes in a doc, update the matching rule in the same change.

### Comments

**Default: do not add comments.** Write a comment ONLY if it falls into one of these three buckets:

1. A non-obvious _why_ a reviewer would otherwise ask out loud (e.g. `// preallocate to avoid GC churn during drag`)
2. A workaround that links to an issue (e.g. `// workaround: react#12345`)
3. A `TODO`/`FIXME` with context and a follow-up

If a comment restates what the code already says, delete it. Names, types, and small functions carry the meaning. Never leave commented-out code — git has history.

### Tool Hygiene

Patterns that recurred in past sessions and cost real turns. Apply them by default — only deviate with a reason.

- **Edit, don't rewrite.** Use `Edit` for any change that touches less than ~70% of a file. `Write` is for new files or full rewrites — using it to "edit" risks silently deleting unrelated content.
- **Read, don't `cat | head | tail`.** Use the `Read` tool with `offset`/`limit` to inspect parts of a file. Long shell pipelines on the same file across turns are wasted round-trips.
- **Git archaeology in one shot.** To find when a symbol, atom, or behaviour changed, use `git log -S '<symbol>' --oneline -- <path>` or `git log -p -- <path>` once. Don't stash/checkout-loop through commits to bisect by hand.
- **Baseline before chasing reds.** When tests are red on the working branch, first run `pnpm check` (or the failing subset) on `main` to capture pre-existing failures. Don't fix Storybook a11y or unrelated e2e reds that were broken before your change.
- **Parallel reads.** Independent `Read`/`Grep`/`Bash` calls go in one message. Sequential is only for genuinely dependent calls (e.g. needing a file path from `Grep` output).
- **`pnpm check` once per logical iteration.** Run it after a coherent group of edits, not after every single `Edit`. The script takes ~10s; serial `check` loops add up.
- **LSP for types and references.** `hover` gives the real inferred type, `findReferences` is scope-aware (vs. Grep matching strings). Cold-start quirks: batch a cheap `documentSymbol` in the same message as your first real LSP call (`tsserver` indexes lazily), and group multiple LSP questions about the same file into one message. Retry once when `hover` returns `any` on a clearly-typed symbol, `findReferences` returns ≤ 2 results for an _exported_ symbol, or `goToDefinition` lands on the call site.
- **LSP diagnostics arrive as a push, not a tool call.** The `typescript-lsp` plugin (enabled via `ENABLE_LSP_TOOL=1`) emits a `<new-diagnostics>` system reminder after every `Edit`/`Write` that introduces a _new_ TS error. Trust those for fast feedback — they only fire on changes, so pre-existing reds need `pnpm check`.

## Testing Strategy

Test at the layer where the logic lives, smallest first: pure logic → component → e2e. Layer table, golden-file conventions, and Jotai test helpers → `docs/testing.md`.

## Common Tasks

Before starting, open the matching doc — it has the full walkthrough.

| Task                    | Read first              | Entry point                                                                    |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Add a shape type        | `docs/shapes.md`        | `src/types/shapes.ts`                                                          |
| Add a command           | `docs/commands.md`      | `src/store/commands/` via `createCommand`                                      |
| Add a gesture           | `docs/gestures.md`      | `src/store/atoms/gestures/registry.ts`                                         |
| Add a shadcn primitive  | `docs/ui-primitives.md` | `pnpm dlx shadcn@latest add <name>`, then wrap in `src/components/primitives/` |
| Add an export format    | `docs/export.md`        | `src/features/export/`                                                         |
| Add a keyboard shortcut | —                       | `src/features/shortcuts/registry.ts` (no ad-hoc listeners)                     |
| Write tests             | `docs/testing.md`       | Co-located `*.test.ts` next to source                                          |

### Debugging canvas issues

- The `<svg>` DOM reflects atom state 1:1 — inspect in devtools first.
- `jotai-devtools` (`<DevTools />` in dev mode) shows all atom values.
- Unnecessary re-renders → atom is too coarse-grained, split it.
- `pnpm test:e2e --headed` watches Playwright drive the canvas.

## What NOT to Do

- ❌ Don't manipulate the SVG DOM imperatively (no `ref.current.setAttribute`). React renders it.
- ❌ Don't add a new state management library. Jotai handles everything here.
- ❌ Wrong atom granularity in either direction: no monolithic app-state atom, and no subscribing to a large atom to read one field — use small atoms + derived atoms.
- ❌ Don't use `dangerouslySetInnerHTML` for user SVG content — parse it via DOMParser and validate.
- ❌ Don't bypass the command pattern for "small" changes. Undo/redo depends on it.
- ❌ Don't import from `@/components/ui/*` outside `src/components/primitives/**`. App code goes through the primitives seam; see `docs/ui-primitives.md`. ESLint will flag it.
- ❌ Don't add comments that restate the code. Default is no comment; only the three buckets in `Conventions > Comments` are allowed.
- ❌ Don't commit without running `pnpm check`.

## MCP Servers Configured

No project-level MCP servers are configured (`.mcp.json` absent). Available via user-level config:

- **Context7** (`claude.ai Context7` + `plugin:context7:context7`) — fetch up-to-date library/framework docs. Prefer this over web search for API/CLI/SDK questions.

## When You're Stuck

- Search existing tests for usage patterns (`grep -r` in `src/`). `src/features/canvas/` is the most mature reference when conventions are unclear.
- About to suppress a TypeScript error? Stop — it's almost always pointing to a real missing case.

## Definition of Done

A change is done when:

- [ ] `pnpm check` passes (covers tsc + eslint + prettier + vitest)
- [ ] New logic has tests at the appropriate layer
