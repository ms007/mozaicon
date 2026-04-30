---
paths:
  - 'src/components/ui/**'
  - 'src/components/primitives/**'
---

# UI Primitives

Read @docs/ui-primitives.md before adding or modifying primitives. It covers the
vendoring model, the wrapper seam, and the three wrap patterns (re-export,
composition, fork) in full.

## Quick rules

- **`src/components/ui/*` is vendored shadcn output.** Don't hand-edit. Re-run
  `pnpm dlx shadcn@latest add <name>` to regenerate.
- **App code never imports from `@/components/ui/*`.** Always import from
  `@/components/primitives/<Name>`. ESLint's `no-restricted-imports` enforces
  this outside `src/components/primitives/**`.
- **Every primitive needs a wrapper file** in `src/components/primitives/`,
  even if it starts as a named-re-export pass-through. Upgrade to composition
  or fork only when a real need appears — see the doc for the decision tree.

## Adding a new primitive

1. `pnpm dlx shadcn@latest add <name>` (writes to `src/components/ui/`)
2. Create `src/components/primitives/<Name>.tsx`
3. Update call-sites to import from `@/components/primitives/<Name>`
4. `pnpm check`
