# Design Tokens

Single source of truth for the DS ↔ shadcn ↔ Tailwind mapping. If you're wiring a
new component, picking a class, or adjusting a token, this page is the
authoritative reference.

Token storage lives in [`src/index.css`](../src/index.css): OKLCH CSS variables
on `:root` / `.dark`, remapped onto Tailwind utilities through a `@theme inline`
block. Behavior / API lives in [`docs/ui-primitives.md`](./ui-primitives.md).
The two docs never contradict — if they seem to, this one wins and the other
gets fixed.

## Theme Mechanics

- **Selector:** `.dark` class on an ancestor (enabled via
  `@custom-variant dark (&:is(.dark *))`). **Not** `[data-theme="dark"]`.
- **Default:** light. `:root` carries the light palette; `.dark` only carries
  overrides.
- **Toggling:** add / remove the `dark` class on `<html>` (or any ancestor of
  the themed subtree).
- **Storage format:** OKLCH. Hex values in the comments are the DS source
  colors; OKLCH is the runtime format. Alpha-composited tokens (notably
  `--primary-muted`) are approximate round-trips from the DS hex/rgba source.

## Color Tokens

Each row: DS name → CSS variable → shadcn role → Tailwind utility → light
OKLCH → dark OKLCH. Copy-paste OKLCH values from this table; they match
`src/index.css` verbatim.

### Surfaces & Text

| DS name            | CSS var                  | shadcn role          | Tailwind utility            | Light OKLCH                | Dark OKLCH                 |
| ------------------ | ------------------------ | -------------------- | --------------------------- | -------------------------- | -------------------------- |
| `--bg-base`        | `--background`           | `background`         | `bg-background`             | `oklch(1 0 0)`             | `oklch(0.141 0.005 285.8)` |
| `--text-primary`   | `--foreground`           | `foreground`         | `text-foreground`           | `oklch(0.141 0.005 285.8)` | `oklch(0.944 0.004 286.3)` |
| `--bg-surface`     | `--card`                 | `card`               | `bg-card`                   | `oklch(0.985 0 0)`         | `oklch(0.177 0.004 286)`   |
| —                  | `--card-foreground`      | `card-foreground`    | `text-card-foreground`      | `oklch(0.141 0.005 285.8)` | `oklch(0.944 0.004 286.3)` |
| —                  | `--popover`              | `popover`            | `bg-popover`                | `oklch(0.985 0 0)`         | `oklch(0.177 0.004 286)`   |
| —                  | `--popover-foreground`   | `popover-foreground` | `text-popover-foreground`   | `oklch(0.141 0.005 285.8)` | `oklch(0.944 0.004 286.3)` |
| `--bg-elevated`    | `--secondary`            | `secondary`          | `bg-secondary`              | `oklch(0.967 0.001 286.4)` | `oklch(0.216 0.007 286)`   |
| —                  | `--secondary-foreground` | `secondary-fg`       | `text-secondary-foreground` | `oklch(0.141 0.005 285.8)` | `oklch(0.944 0.004 286.3)` |
| `--bg-elevated`    | `--muted`                | `muted`              | `bg-muted`                  | `oklch(0.967 0.001 286.4)` | `oklch(0.216 0.007 286)`   |
| `--text-secondary` | `--muted-foreground`     | `muted-foreground`   | `text-muted-foreground`     | `oklch(0.421 0.011 286)`   | `oklch(0.647 0.011 286)`   |
| `--bg-elevated`    | `--input`                | `input`              | `bg-input` / `border-input` | `oklch(0.967 0.001 286.4)` | `oklch(0.216 0.007 286)`   |
| `--bg-hover`       | `--accent`               | `accent` (neutral)   | `bg-accent`                 | `oklch(0.921 0.002 286.3)` | `oklch(0.257 0.009 286)`   |
| —                  | `--accent-foreground`    | `accent-foreground`  | `text-accent-foreground`    | `oklch(0.141 0.005 285.8)` | `oklch(0.944 0.004 286.3)` |

> `--secondary`, `--muted`, and `--input` all resolve to DS `--bg-elevated`
> per the "three roles, one surface" collapse in the design-system PRD.
> `--accent` is the **neutral** hover tint, not the brand color — the brand
> lives on `--primary`.

### Brand (Indigo)

| DS name      | CSS var                | shadcn role    | Tailwind utility          | Light OKLCH                      | Dark OKLCH                       |
| ------------ | ---------------------- | -------------- | ------------------------- | -------------------------------- | -------------------------------- |
| brand        | `--primary`            | `primary`      | `bg-primary`              | `oklch(0.585 0.233 277.1)`       | `oklch(0.585 0.233 277.1)`       |
| brand-fg     | `--primary-foreground` | `primary-fg`   | `text-primary-foreground` | `oklch(1 0 0)`                   | `oklch(1 0 0)`                   |
| brand-hover  | `--primary-hover`      | (DS extension) | `bg-primary-hover`        | `oklch(0.511 0.262 276.9)`       | `oklch(0.673 0.182 276.9)`       |
| brand-muted  | `--primary-muted`      | (DS extension) | `bg-primary-muted`        | `oklch(0.585 0.233 277.1 / 10%)` | `oklch(0.585 0.233 277.1 / 15%)` |
| brand-subtle | `--primary-subtle`     | (DS extension) | `text-primary-subtle`     | `oklch(0.459 0.241 277)`         | `oklch(0.779 0.13 276.3)`        |

Brand indigo is the single accent: active tool, selection, focus ring, slider
thumb. `--primary-hover` goes **darker** on light backgrounds (Indigo 600) and
**lighter** on dark backgrounds (Indigo 400) — the raw hex sources differ per
theme.

### Status

| DS name    | CSS var                | shadcn role    | Tailwind utility              | Light OKLCH                | Dark OKLCH                 |
| ---------- | ---------------------- | -------------- | ----------------------------- | -------------------------- | -------------------------- |
| success    | `--success`            | (DS extension) | `bg-success` / `text-success` | `oklch(0.697 0.156 163.5)` | `oklch(0.772 0.155 163.2)` |
| —          | `--success-foreground` | (DS extension) | `text-success-foreground`     | `oklch(1 0 0)`             | `oklch(0.141 0.005 285.8)` |
| `--danger` | `--destructive`        | `destructive`  | `bg-destructive`              | `oklch(0.628 0.258 27.3)`  | `oklch(0.628 0.258 27.3)`  |

Status colors are reserved for their role per DS usage rules — never use
`--destructive` for neutral emphasis.

### Borders, Rings, Track

| DS name       | CSS var          | shadcn role    | Tailwind utility      | Light OKLCH                | Dark OKLCH                 |
| ------------- | ---------------- | -------------- | --------------------- | -------------------------- | -------------------------- |
| border        | `--border`       | `border`       | `border-border`       | `oklch(0.912 0.003 286.3)` | `oklch(0.257 0.009 286)`   |
| border-hover  | `--border-hover` | (DS extension) | `border-border-hover` | `oklch(0.856 0.005 286.3)` | `oklch(0.345 0.015 286)`   |
| ring          | `--ring`         | `ring`         | `ring-ring`           | `oklch(0.585 0.233 277.1)` | `oklch(0.585 0.233 277.1)` |
| `--bg-active` | `--track`        | (DS extension) | `bg-track`            | `oklch(0.871 0.006 286.3)` | `oklch(0.296 0.011 286)`   |

Focus ring is always the brand color — `--ring` = `--primary`.

### Sidebar & Chart (shadcn vendor)

Sidebar tokens (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`,
`--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`,
`--sidebar-border`, `--sidebar-ring`) exist so the vendored shadcn sidebar
primitive keeps working out of the box. They shadow the surface / brand / border
tokens on light and dark and are exposed as `bg-sidebar`, `text-sidebar-foreground`,
etc.

Chart tokens (`--chart-1` … `--chart-5`, utilities `bg-chart-1` …) retain shadcn
defaults; they're **not** DS-scoped.

### Scoped Tokens (footnote)

`--checker-a` and `--checker-b` drive the preview-area transparency
checkerboard. They're intentionally **not** exposed as Tailwind color utilities
— there's no `bg-checker-a`. The two values live on `:root` / `.dark` so the
pattern retints with the theme, and the feature component that paints the
checkerboard reads the CSS variables directly via `var(--checker-a)`.

Rule of thumb: a token that belongs to exactly one feature and has no business
leaking into other components stays scoped like this. Keep it out of
`@theme inline`.

## Radii

One knob retints the whole app:

```css
--radius: 0.375rem; /* 6px */
```

Derived scale (exposed under Tailwind):

| Tailwind     | CSS var       | Formula          | Pixels | Use                                                   |
| ------------ | ------------- | ---------------- | ------ | ----------------------------------------------------- |
| `rounded-sm` | `--radius-sm` | `--radius - 4px` | 2px    | Tight inner surfaces, checkboxes.                     |
| `rounded-md` | `--radius-md` | `--radius - 2px` | 4px    | **Buttons.**                                          |
| `rounded-lg` | `--radius-lg` | `--radius`       | 6px    | **Cards, panels, inputs.**                            |
| `rounded-xl` | `--radius-xl` | `--radius + 4px` | 10px   | **Reserved** — don't reach for this without a reason. |

## Type Scale

Base is 16px (browser default). Tailwind's `text-*` utilities are overridden
via `@theme inline` to target DS pixel sizes:

| Utility     | Size | Line height | Role                                      |
| ----------- | ---- | ----------- | ----------------------------------------- |
| `text-xs`   | 10px | 1.2         | Labels, eyebrows, status readouts.        |
| `text-sm`   | 11px | 1.3         | Controls, layer rows.                     |
| `text-base` | 13px | 1.5         | Body copy (applied globally on `<body>`). |
| `text-lg`   | 14px | 1.4         | Subsection titles.                        |
| `text-xl`   | 18px | 1.3         | Section / h2.                             |
| `text-2xl`  | 34px | 1.1         | Display / page title.                     |

The 16px base matters for two reasons:

1. `rem`-based values in third-party code still resolve against `16px`, which
   keeps vendor math predictable.
2. Browser zoom and OS font-scale settings are preserved — sizing off anything
   but the browser default breaks accessibility.

Don't redefine these per component. If a new surface needs 12px text, add a
new `text-*` step to `@theme inline` rather than one-off `text-[12px]`.

### Fonts

| Utility     | Family                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| `font-sans` | `system-ui`, `sans-serif`.                                              |
| `font-mono` | `ui-monospace`, `'SF Mono'`, `'Cascadia Code'`, `'Menlo'`, `monospace`. |

The sans stack is the platform UI font: San Francisco on Apple, Segoe UI on
Windows, Cantarell/Roboto on Linux. No webfont is shipped — the browser uses
whatever the OS hands it. This trades cross-OS visual consistency for native
rendering quality (notably SF's optical sizing at 11–13 px). `tabular-nums` is
applied globally on `<body>`; numeric-leaning inputs (e.g. `primitives/Input`)
add `font-mono` as well.

## Spacing

Tailwind's default 4px scale is preserved. The DS uses a **restricted** subset:

| Usable steps       | Typical role                         |
| ------------------ | ------------------------------------ |
| `1` / `p-1` (4px)  | Micro gutters inside tight controls. |
| `2` / `p-2` (8px)  | Icon padding, small gaps.            |
| `3` / `p-3` (12px) | Default control padding, row gaps.   |
| `4` / `p-4` (16px) | Section padding inside panels.       |
| `6` / `p-6` (24px) | Panel inset, dialog padding.         |
| `8` / `p-8` (32px) | Hero / empty-state padding.          |

**Avoid `p-5`, `p-7`, `m-5`, `m-7`** (and their axis variants `px-5`, `py-7`,
etc.). The gap is intentional: the DS density picks up a coarser rhythm than
Tailwind's full scale, and the "forbidden" steps are where the rhythm breaks
— 20px and 28px don't align with the 8px column the rest of the app rides.
If a layout "wants" 20px, the right answer is almost always 16px or 24px,
not `p-5`.

"Gap on purpose" — same principle as unassigned keyboard shortcuts. The
easiest way to keep a system consistent is to make inconsistent choices
inconvenient.

## Motion

Motion tokens live in `:root` and are re-exposed via `@theme inline`, so
Tailwind's built-in `ease-out` utility resolves to the DS curve.

| Concern            | Value                                        | Notes                                                              |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------ |
| Curve              | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` | Rebinds Tailwind's `ease-out` utility globally.                    |
| Button / nav state | `duration-150`                               | Hover, focus, pressed surface transitions.                         |
| Pill slide         | `duration-200`                               | Segmented-control indicator, tab underlines.                       |
| Press feedback     | `active:scale-[0.97]`                        | Tactile compress on `:active`; pairs with `transition-transform`.  |
| Reduced motion     | `@media (prefers-reduced-motion: reduce)`    | Global base-layer rule collapses animations and transitions to ~0. |

Reduced-motion suppression is deliberately authored at the **token layer**
(base CSS) rather than per-component: every component inherits the reduction
without re-authoring. The rule collapses `animation-duration`,
`animation-iteration-count`, `transition-duration`, `transition-delay`, and
`scroll-behavior`; `transform` itself is left alone so Radix floating
positioning, tooltip placement, and layout transforms keep working.

## Where to change things

| Want to change…                                   | Where                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| A color, radius, spacing knob, type size, motion. | [`src/index.css`](../src/index.css) — token layer.                    |
| A default variant, a forwarded ref, extra props.  | `src/components/primitives/<Name>.tsx` — wrapper layer.               |
| A structural change to a vendor primitive.        | Fork it; see [`docs/ui-primitives.md`](./ui-primitives.md) Pattern 3. |

If the change is expressible as a CSS variable, it belongs here. If it's only
expressible in TSX, it belongs in a primitive wrapper.
