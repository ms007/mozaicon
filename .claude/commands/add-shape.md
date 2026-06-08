---
description: Add a new shape type to the SVG Icon Creator
argument-hint: <shapeName>
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run check)
---

# Add Shape: $ARGUMENTS

Add a new shape type called `$ARGUMENTS` to the SVG Icon Creator.

## Before starting

Read these files in order:

1. @docs/shapes.md — the full walkthrough (required)
2. @src/types/shapes.ts — the current shape union
3. @src/lib/svg/shapeElement.ts — the element tree (shape-to-element translation)
4. @docs/architecture.md — section "State Shape" (if you need context on the schema)

## Task

Implement the new shape type following every step in `docs/shapes.md`:

1. Zod schema in `src/types/shapes.ts` (extend the discriminated union)
2. Element tree case in `src/lib/svg/shapeElement.ts` (`shapeToElement`)
3. Bounding box handler in `src/lib/svg/bbox.ts`
4. Translate handler in `src/lib/svg/transform.ts`
5. Hit test in `src/lib/svg/hitTest.ts`
6. Properties editor in `src/features/properties/editors/`
7. Drawing tool in `src/features/toolbar/tools/<name>.ts` (only if user-drawable — ask me if unsure). See `docs/shapes.md` § Drawing Tools for the `DrawTool` interface, lifecycle, threshold, modifiers, and draft rendering.
8. Tests for: schema validation, bbox correctness, translate invariants, element tree output

## Rules

- **Do not suppress TypeScript errors.** After step 1, TS will flag every missing case via `assertNever`. Those errors are your checklist — work through them one by one.
- **Do not skip tests.** Each pure-function addition (`lib/`) needs a unit test.
- **Run `npm run check` after step 5 and again at the end.** Stop and report if it fails.
- **Follow existing patterns.** Look at how `rect` is implemented for reference.

## Report back

When done, summarize:

- Which files you created or modified
- How `npm run check` finished (pass/fail)
- Any decisions you made that aren't obvious from the code (e.g., how you handled edge cases)
- Whether a drawing tool was added, or whether it still needs one
