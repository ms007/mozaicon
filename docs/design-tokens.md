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
| `--bg-base`        | `--background`           | `background`         | `bg-background`             | `oklch(0.971 0.003 286.4)` | `oklch(0.141 0.004 285.8)` |
| `--text-primary`   | `--foreground`           | `foreground`         | `text-foreground`           | `oklch(0.181 0.014 284.9)` | `oklch(0.944 0.005 286.3)` |
| `--bg-surface`     | `--card`                 | `card`               | `bg-card`                   | `oklch(1 0 0)`             | `oklch(0.179 0.004 286)`   |
| —                  | `--card-foreground`      | `card-foreground`    | `text-card-foreground`      | `oklch(0.181 0.014 284.9)` | `oklch(0.944 0.005 286.3)` |
| —                  | `--popover`              | `popover`            | `bg-popover`                | `oklch(1 0 0)`             | `oklch(0.179 0.004 286)`   |
| —                  | `--popover-foreground`   | `popover-foreground` | `text-popover-foreground`   | `oklch(0.181 0.014 284.9)` | `oklch(0.944 0.005 286.3)` |
| `--bg-elevated`    | `--secondary`            | `secondary`          | `bg-secondary`              | `oklch(0.941 0.005 286.3)` | `oklch(0.22 0.01 285.6)`   |
| —                  | `--secondary-foreground` | `secondary-fg`       | `text-secondary-foreground` | `oklch(0.181 0.014 284.9)` | `oklch(0.944 0.005 286.3)` |
| `--bg-elevated`    | `--muted`                | `muted`              | `bg-muted`                  | `oklch(0.941 0.005 286.3)` | `oklch(0.22 0.01 285.6)`   |
| `--text-secondary` | `--muted-foreground`     | `muted-foreground`   | `text-muted-foreground`     | `oklch(0.474 0.026 285.4)` | `oklch(0.651 0.018 285.9)` |
| `--bg-elevated`    | `--input`                | `input`              | `bg-input` / `border-input` | `oklch(0.941 0.005 286.3)` | `oklch(0.22 0.01 285.6)`   |
| `--bg-hover`       | `--accent`               | `accent` (neutral)   | `bg-accent`                 | `oklch(0.915 0.008 286.2)` | `oklch(0.255 0.011 285.6)` |
| —                  | `--accent-foreground`    | `accent-foreground`  | `text-accent-foreground`    | `oklch(0.181 0.014 284.9)` | `oklch(0.944 0.005 286.3)` |

> `--secondary`, `--muted`, and `--input` all resolve to DS `--bg-elevated`
> per the "three roles, one surface" collapse in the design-system PRD.
> `--accent` is the **neutral** hover tint, not the brand color — the brand
> lives on `--primary`.

### Brand (Indigo)

| DS name      | CSS var                | shadcn role    | Tailwind utility          | Light OKLCH                      | Dark OKLCH                       |
| ------------ | ---------------------- | -------------- | ------------------------- | -------------------------------- | -------------------------------- |
| brand        | `--primary`            | `primary`      | `bg-primary`              | `oklch(0.525 0.211 275.4)`       | `oklch(0.585 0.204 277.1)`       |
| brand-fg     | `--primary-foreground` | `primary-fg`   | `text-primary-foreground` | `oklch(1 0 0)`                   | `oklch(1 0 0)`                   |
| brand-hover  | `--primary-hover`      | (DS extension) | `bg-primary-hover`        | `oklch(0.585 0.204 277.1)`       | `oklch(0.68 0.158 276.9)`        |
| brand-muted  | `--primary-muted`      | (DS extension) | `bg-primary-muted`        | `oklch(0.525 0.211 275.4 / 12%)` | `oklch(0.585 0.204 277.1 / 15%)` |
| brand-faint  | `--primary-faint`      | (DS extension) | `bg-primary-faint`        | `oklch(0.95 0.01 288.9 / 1)`     | `oklch(0.2 0.04 283.6)`          |
| brand-subtle | `--primary-subtle`     | (DS extension) | `text-primary-subtle`     | `oklch(0.398 0.177 277.4)`       | `oklch(0.785 0.104 274.7)`       |

Brand indigo is the single accent: active tool, selection, focus ring, slider
thumb. The resting brand is `#4f52e0` on light and `#6366f1` (Indigo 500) on
dark. `--primary-hover` always **lifts toward lighter** — `#6366f1` (Indigo 500)
on light, `#818cf8` (Indigo 400) on dark. The raw hex sources differ per theme.

Browser text selection (`::selection`) is wired to `--primary` /
`--primary-foreground` in the base layer so marked text adopts the brand
indigo in both themes.

### Status

| DS name    | CSS var                    | shadcn role    | Tailwind utility              | Light OKLCH               | Dark OKLCH                 |
| ---------- | -------------------------- | -------------- | ----------------------------- | ------------------------- | -------------------------- |
| success    | `--success`                | (DS extension) | `bg-success` / `text-success` | `oklch(0.627 0.17 149.2)` | `oklch(0.773 0.153 163.2)` |
| —          | `--success-foreground`     | (DS extension) | `text-success-foreground`     | `oklch(1 0 0)`            | `oklch(0.141 0.004 285.8)` |
| `--danger` | `--destructive`            | `destructive`  | `bg-destructive`              | `oklch(0.577 0.215 27.3)` | `oklch(0.637 0.208 25.3)`  |
| —          | `--destructive-foreground` | (DS extension) | `text-destructive-foreground` | `oklch(1 0 0)`            | `oklch(1 0 0)`             |
| —          | `--destructive-hover`      | (DS extension) | `bg-destructive-hover`        | `oklch(0.505 0.19 27.5)`  | `oklch(0.704 0.191 22.2)`  |

Status colors are reserved for their role per DS usage rules — never use
`--destructive` for neutral emphasis.

### Borders, Rings, Track

| DS name       | CSS var          | shadcn role    | Tailwind utility      | Light OKLCH                | Dark OKLCH                 |
| ------------- | ---------------- | -------------- | --------------------- | -------------------------- | -------------------------- |
| border        | `--border`       | `border`       | `border-border`       | `oklch(0.897 0.011 286.2)` | `oklch(0.255 0.011 285.6)` |
| border-hover  | `--border-hover` | (DS extension) | `border-border-hover` | `oklch(0.836 0.017 286)`   | `oklch(0.326 0.023 285.1)` |
| ring          | `--ring`         | `ring`         | `ring-ring`           | `oklch(0.525 0.211 275.4)` | `oklch(0.585 0.204 277.1)` |
| `--bg-active` | `--track`        | (DS extension) | `bg-track`            | `oklch(0.885 0.011 286.2)` | `oklch(0.288 0.014 285.5)` |

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
| `rounded-md` | `--radius-md` | `--radius - 2px` | 4px    | **Buttons**, tags, badges, small inputs.              |
| `rounded-lg` | `--radius-lg` | `--radius`       | 6px    | **Cards, panels, inputs.**                            |
| `rounded-xl` | `--radius-xl` | `--radius + 4px` | 10px   | **Reserved** — don't reach for this without a reason. |

## Type Scale

Base is 16px (browser default). Tailwind's `text-*` utilities are overridden
via `@theme inline` to target DS pixel sizes:

| Utility     | Size | Line height | Role                                        |
| ----------- | ---- | ----------- | ------------------------------------------- |
| `text-xs`   | 10px | 1.2         | Labels, eyebrows, status readouts.          |
| `text-sm`   | 11px | 1.3         | Layer rows, slider readouts, mono captions. |
| `text-md`   | 12px | 1.3         | Buttons, compact labels.                    |
| `text-base` | 13px | 1.5         | Body copy (applied globally on `<body>`).   |
| `text-lg`   | 14px | 1.4         | Subsection titles.                          |
| `text-xl`   | 18px | 1.3         | Section / h2.                               |
| `text-2xl`  | 34px | 1.1         | Display / page title.                       |

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

Motion tokens live in `:root` and are re-exposed via `@theme inline`. Tailwind's
own transition defaults (`--default-transition-duration` and
`--default-transition-timing-function`) are overridden so every `transition-*`
utility — `transition-colors`, `transition-opacity`, etc. — picks up DS values
without per-call-site `duration-*` / `ease-*`. Components that genuinely need a
different cadence (e.g. slide indicators) opt out explicitly.

| Concern          | Value                                        | Notes                                                                                         |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Curve            | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` | Bound to `--default-transition-timing-function` and to Tailwind's `ease-out` utility.         |
| Default duration | `120ms`                                      | Bound to `--default-transition-duration`. Hover, focus, pressed, and color/border swaps.      |
| Pill slide       | `duration-200`                               | Segmented-control indicator, tab underlines — opt out of the default with explicit class.     |
| Press feedback   | `active:scale-[0.97]`                        | Tactile compress on `:active`. Snaps instantly — `transition-colors` doesn't cover transform. |
| Reduced motion   | `@media (prefers-reduced-motion: reduce)`    | Global base-layer rule collapses animations and transitions to ~0.                            |

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
