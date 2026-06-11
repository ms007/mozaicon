# UI Primitives

This document describes how shadcn/ui primitives are vendored, wrapped, and consumed in Mozaicon. Read it before adding a new primitive or touching `src/components/ui/**` or `src/components/primitives/**`.

## Directory Layout

```
src/
  components/
    ui/          # shadcn-generated output (vendored). Overwritten on regeneration.
    primitives/  # stable wrappers around ui/. The only layer app code imports from.
    *.tsx        # app-level components (feature-agnostic, Mozaicon-specific).
  features/      # feature components may import from primitives/, never from ui/.
```

Three folders, three roles:

- **`src/components/ui/`** — vendor code. Populated by `pnpm dlx shadcn@latest add <name>`. Treated like `node_modules`: don't hand-edit, don't reformat, don't lint for react-refresh boundaries. `eslint.config.js` disables `simple-import-sort/imports`, `react-refresh/only-export-components`, `no-restricted-imports`, and `@typescript-eslint/prefer-nullish-coalescing` here so regenerated files stay byte-identical to shadcn output.
- **`src/components/primitives/`** — our stable seam. Every shadcn primitive the app uses has exactly one wrapper file here. This is what call-sites import.
- **`src/components/*.tsx`** (top level) and **`src/features/**`** — application code. Imports primitives by `@/components/primitives/<Name>`, never from `@/components/ui/\*`.

## Why a Wrapper Layer

`shadcn add --overwrite` regenerates files in `components/ui/` verbatim. Without the primitives seam, every customization — a default variant, a tweaked class, a forwarded ref — would either live inside vendor code (lost on the next regen) or force every call-site to re-thread the same props.

The `primitives/` layer localises that blast radius:

- Call-sites import a stable path (`@/components/primitives/Button`). They never change when shadcn is updated.
- Our customizations live in the wrapper, not in vendor code. `--overwrite` is safe to run.
- When shadcn's API genuinely changes, reconciliation happens in **one file per primitive**, not across the whole codebase.

## The Golden Rule

> **App code imports shadcn primitives only from `@/components/primitives/*`.**

This is enforced by ESLint. `eslint.config.js` ships a `no-restricted-imports` rule that blocks `@/components/ui/*` globally and re-enables it only inside `src/components/primitives/**`:

```js
// eslint.config.js (excerpt)
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['@/components/ui/*'],
    message:
      'Import shadcn primitives from @/components/primitives/* instead. ...',
  }],
}],
```

A separate override in the same config opens the door back up for the primitives layer itself:

```js
{
  files: ['src/components/primitives/**/*.{ts,tsx}'],
  rules: { 'no-restricted-imports': 'off', 'react-refresh/only-export-components': 'off' },
}
```

If you ever need to bypass this, stop: the right move is almost always a new wrapper, not a one-off import.

## Adding a shadcn Primitive

1. **Install via the CLI.** From the repo root:
   ```bash
   pnpm dlx shadcn@latest add <name>
   ```
   This writes to `src/components/ui/<name>.tsx` per `components.json` (`aliases.ui = "@/components/ui"`). Let it overwrite; don't hand-edit the result.
2. **Create the wrapper.** Add `src/components/primitives/<Name>.tsx`. Start with the pass-through pattern (below) and upgrade only when there's a concrete reason.
3. **Import from the wrapper.** At every call-site in the app, import from `@/components/primitives/<Name>` — never from `@/components/ui/<name>`. ESLint will flag violations.
4. **Run `pnpm check`.** It runs `tsc`, ESLint, Prettier, and Vitest. This is the gate for "does this pass CI".

## The Three Wrap Patterns

Pick the lightest pattern that solves the problem. Upgrade later if requirements grow.

### 1. Pass-through

Use when the shadcn component's default API is exactly what the app needs. The wrapper is a named re-export — nothing more.

Live example: [`src/components/primitives/ToggleGroup.tsx`](../src/components/primitives/ToggleGroup.tsx)

```tsx
// Pass-through wrapper for the shadcn ToggleGroup primitive (Pattern 1 — see
// docs/ui-primitives.md). No behavior added; DS tokens in index.css retint it.
//
// Named re-exports (not `export *`) so react-refresh can statically see what
// leaves this module.
export { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
```

Why named re-exports: `export *` breaks the react-refresh boundary because the bundler can't statically enumerate what's leaving the module. List exports explicitly.

### 2. Composition Wrapper

Use when you want to bake in a default className, a default variant, or props that are always forwarded the same way. Keep the underlying primitive's full prop surface intact.

```tsx
// Pseudo-template — create the real file only when needed.
import { cn } from '@/lib/utils'
import { Button as UIButton } from '@/components/ui/button'
import type { ComponentProps } from 'react'

export function IconButton({ className, ref, ...props }: ComponentProps<typeof UIButton>) {
  return (
    <UIButton
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('rounded-full', className)}
      {...props}
    />
  )
}
```

Notes:

- `cn(defaults, className)` merges so callers can still override.
- `ref` is a **normal prop in React 19** — no `forwardRef`. Destructure it alongside other props and pass it through.
- Keep the underlying component's type surface: use `ComponentProps<typeof UIButton>` instead of redeclaring props by hand.

### 3. Fork

Use only when the vendor component needs structural changes that can't be expressed via props — e.g. a different primitive under the hood, or removing built-in behavior. Forks are a maintenance burden: shadcn updates no longer reach them. Prefer patterns 1 or 2 when feasible.

When forking, copy the shadcn file into `src/components/primitives/<Name>.tsx`, modify it there, and add a mandatory header:

```tsx
// FORKED from @/components/ui/<name> at shadcn <date>.
```

The date is the day of the fork, ISO format (e.g. `2026-04-23`). The header is a tripwire: whoever next updates shadcn sees it and knows this file needs manual reconciliation rather than a blind regen.

Live example: [`src/components/primitives/Button.tsx`](../src/components/primitives/Button.tsx). The tripwire header is right at the top of the file, and the fork collapses the shadcn variant/size surface onto the DS vocabulary — shadcn `default` → our `primary` (loud export action), shadcn `outline` → our `default` (quiet chrome), `secondary`/`link` removed, `ghost`/`destructive` kept, plus a `pressed` prop that surfaces toggle state via `aria-pressed` so DS pressed-state styling keys off the DOM attribute.

## CSS Tokens vs Wrappers

Two separate concerns with a clean boundary:

- **Design tokens** — colors, radii, shadows, spacing scales. Live in [`src/index.css`](../src/index.css) as CSS variables (`--primary`, `--radius`, …). Editing them retints the whole app uniformly, including the vendored `ui/` components, because shadcn reads the same variables. No wrapper needed. The full DS ↔ shadcn ↔ Tailwind mapping lives in [`docs/design-tokens.md`](./design-tokens.md).
- **Behavior / API** — default variants, forwarded refs, composition, extra props. Live in the wrapper under `src/components/primitives/`.

Rule of thumb: if the change is expressible as a CSS variable, put it in `src/index.css`. If it's expressible only in TSX (a different default `variant`, an always-on `size="icon"`, a new prop), put it in the wrapper.

## Testing

- **Pass-through wrappers need no tests.** They add no behavior — testing them would just reassert what shadcn already guarantees. Tests live at the call-site or in the underlying `ui/` component (which we don't test either, as vendor code).
- **Composition wrappers** get a component test only for the behavior **they add**: the baked-in default, the merged className, the new prop. Don't re-test the full underlying primitive.
- **Forks** are tested as if they were original code — they're no longer vendor.

Follow `docs/testing.md` for the per-layer test conventions (RTL for component tests, co-located `*.test.tsx`).
