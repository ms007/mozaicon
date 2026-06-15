---
description: Add a new shape type to the SVG Icon Creator
argument-hint: <shapeName>
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(pnpm check)
---

# Add Shape: $ARGUMENTS

Add a new shape type called `$ARGUMENTS` to the SVG Icon Creator.

## Before starting

`docs/shapes.md` is the authoritative walkthrough — it stays in sync with the code. Read it first and follow it; the step list below is a summary, the doc wins if they ever disagree.

Read these files in order:

1. @docs/shapes.md — the full walkthrough (required, source of truth)
2. @src/types/shapes.ts — the current shape union
3. @src/lib/svg/shapeElement.ts — the element-tree dispatcher (`shapeToElement`); see `src/lib/svg/rectElement.ts` for the per-shape element seam pattern
4. @docs/state.md — section "State Shape" (if you need context on the schema)

## Task

Implement the new shape type following every step in `docs/shapes.md`. Each capability has an entry in the doc's "Where each capability lives" table:

1. Zod schema in `src/types/shapes.ts` (extend the discriminated union)
2. Element-tree case in `src/lib/svg/shapeElement.ts` (`shapeToElement`); add a `src/lib/svg/<name>Element.ts` seam if rendering needs branching (as `rect` does)
3. Bounding box handler in `src/lib/svg/bbox/` (add a case to `bboxOf.ts` + a per-shape file)
4. Translate handler in `src/lib/geometry/translate.ts`
5. Scale handler in `src/lib/geometry/scale.ts`
6. Properties UI in `src/features/properties/` (follow the existing flat Section + Control + `preview*`/`commit*` pattern, e.g. `CornersSection.tsx`)
7. Drawing tool in `src/features/toolbar/tools/<name>.ts`, registered in `index.ts` (only if user-drawable — ask me if unsure). For press-drag-release shapes use the `createDragTool` factory (`src/features/toolbar/tools/createDragTool.ts`); see `rect.ts` as the reference consumer. Full `DrawTool` contract → `docs/shapes.md` § Drawing Tools.
8. Tests for: schema validation (`src/types/shapes.test.ts`), bbox correctness (`src/lib/svg/bbox/`), translate + scale invariants (`src/lib/geometry/`), element-tree output (`src/lib/svg/shapeElement.test.ts`)

## Rules

- **Do not suppress TypeScript errors.** After step 1, TS will flag every missing case via `assertNever`. Those errors are your checklist — work through them one by one.
- **Do not skip tests.** Each pure-function addition (`lib/`) needs a unit test.
- **Run `pnpm check` after the exhaustiveness errors are resolved (≈ step 5) and again at the end.** Stop and report if it fails.
- **Follow existing patterns.** Look at how `rect` is implemented for reference.

## Report back

When done, summarize:

- Which files you created or modified
- How `npm run check` finished (pass/fail)
- Any decisions you made that aren't obvious from the code (e.g., how you handled edge cases)
- Whether a drawing tool was added, or whether it still needs one
