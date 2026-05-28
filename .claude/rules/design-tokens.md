---
paths:
  - 'src/components/**'
  - 'src/features/**'
---

# Design Tokens

Read @docs/design-tokens.md before picking a Tailwind class, adding a colour,
or adjusting spacing. It is the authoritative DS ↔ shadcn ↔ Tailwind mapping.

## Easy traps

- **No off-scale spacing.** `p-5`, `p-7`, `m-5`, `m-7` (and their axis
  variants `px-5`, `py-7`, …) are forbidden. The gap is intentional — 20px
  and 28px break the 8px rhythm. Use `p-4` (16px) or `p-6` (24px) instead.
- **No one-off type sizes.** `text-[12px]` is wrong. If a surface needs a
  size that isn't in the scale, add a new `text-*` step to `@theme inline` in
  `src/index.css` rather than going arbitrary.
- **`--accent` is the neutral hover tint, not the brand.** Brand lives on
  `--primary`. Reach for `bg-primary` / `text-primary` for active tool,
  selection, focus accent — not `bg-accent`.
- **Status colours are reserved for their role.** Never use `--destructive`
  for plain emphasis. Never use `--success` for "selected".
- **Prefer tokens over arbitrary values.** `bg-[#fff]`,
  `text-[oklch(...)]`, and inline hex are red flags. If the colour you need
  isn't in the table, the answer is almost always "use the token that is".

## Defaults to know

- **Radii:** buttons `rounded-md` (4px), cards / panels / inputs
  `rounded-lg` (6px). `rounded-xl` (10px) is for the Artboard / stage
  surface — don't use it elsewhere.
- **Focus ring:** always brand. `ring-ring` resolves to `--primary`.
- **Motion:** `transition-*` utilities default to **120ms** + DS `ease-out`
  via `--default-transition-duration` / `--default-transition-timing-function`.
  Just write `transition-colors` (or `transition-opacity`, etc.) — no
  `duration-*` / `ease-*` needed. Override only when the cadence genuinely
  differs (e.g. `duration-200` for slide indicators). `active:scale-[0.97]`
  for press feedback (snaps instantly).
- **Dark mode:** `.dark` class on an ancestor (not `[data-theme="dark"]`).

## Where to change things

- A colour, radius, spacing step, type size, or motion value → token layer
  in `src/index.css`.
- A default variant, forwarded ref, or extra prop on a primitive →
  `src/components/primitives/<Name>.tsx` (see @docs/ui-primitives.md).

If the change is expressible as a CSS variable, it belongs in the token
layer. If it's only expressible in TSX, it belongs in a primitive wrapper.
