# Testing

This document describes how we test the SVG Icon Creator: what to test where, patterns for SVG-specific assertions, and the golden-file approach for export.

## Testing Philosophy

- **Test at the lowest layer where the logic lives.** A pure geometry function doesn't need a Playwright test.
- **Prefer many fast tests over few slow ones.** Unit tests run in milliseconds; e2e tests run in seconds.
- **Golden files for SVG output.** Don't hand-write expected SVG strings — generate, review once, commit.
- **No snapshot-spam.** Only snapshot when the output is stable and meaningful (export, not component markup).

## The Testing Pyramid

```
         ┌─────────────┐
         │  Playwright │   ~20 tests    canvas interactions, drag, export flow
         └─────────────┘
       ┌─────────────────┐
       │  Component (RTL)│   ~50 tests  property editors, toolbar, dialogs
       └─────────────────┘
    ┌───────────────────────┐
    │   Atom / Command      │   ~80 tests  store logic, undo/redo, selection
    └───────────────────────┘
  ┌─────────────────────────────┐
  │   Pure lib/ (Vitest)        │   ~200 tests  geometry, path math, serialize
  └─────────────────────────────┘
```

Rough target ratios — not strict rules, but a sanity check.

## Layer 1: Pure Functions (`lib/`)

These are the easiest and highest-value tests. Every function in `lib/` should have tests.

### Example: Path Translation

`src/lib/svg/transform.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { translatePath } from './transform'

describe('translatePath', () => {
  it('translates absolute moves', () => {
    expect(translatePath('M0 0 L10 10', 5, 5)).toBe('M5 5 L15 15')
  })

  it('preserves relative moves', () => {
    expect(translatePath('M0 0 l10 10', 5, 5)).toBe('M5 5 l10 10')
  })

  it('handles curves', () => {
    expect(translatePath('M0 0 C10 0 10 10 20 10', 5, 5)).toBe('M5 5 C15 5 15 15 25 15')
  })

  it('is idempotent at zero', () => {
    const input = 'M0 0 L10 10 Z'
    expect(translatePath(input, 0, 0)).toBe(input)
  })
})
```

**Pattern:** Cover the happy path, edge cases (zero, negatives), and invariants (idempotence, round-trips).

### Example: Bounding Box

```ts
describe('bboxOf', () => {
  it.each([
    [
      'rect',
      { type: 'rect', x: 5, y: 10, width: 20, height: 30 },
      { x: 5, y: 10, width: 20, height: 30 },
    ],
    ['circle', { type: 'circle', cx: 10, cy: 10, r: 5 }, { x: 5, y: 5, width: 10, height: 10 }],
  ])('%s', (_name, shape, expected) => {
    expect(bboxOf(shape as Shape)).toEqual(expected)
  })
})
```

## Layer 2: Atoms and Commands

Test store logic in isolation using Jotai's `createStore`.

### Pattern: Testing a Command

`src/store/commands/moveShape.test.ts`:

```ts
import { createStore } from 'jotai'
import { describe, it, expect } from 'vitest'
import { documentAtom } from '../atoms/document'
import { undoStackAtom } from '../atoms/history'
import { moveShapeCommand } from './moveShape'

function makeStore(shapes: Shape[] = []) {
  const store = createStore()
  store.set(documentAtom, {
    id: 'test',
    name: '',
    viewBox: [0, 0, 100, 100],
    shapes,
  })
  return store
}

describe('moveShapeCommand', () => {
  it('moves a rect by dx/dy', () => {
    const store = makeStore([
      {
        type: 'rect',
        id: 'r1',
        name: 'r',
        visible: true,
        locked: false,
        x: 10,
        y: 10,
        width: 20,
        height: 20,
      },
    ])

    store.set(moveShapeCommand, { id: 'r1', dx: 5, dy: 7 })

    const doc = store.get(documentAtom)
    expect(doc.shapes[0]).toMatchObject({ x: 15, y: 17 })
  })

  it('pushes to undo stack', () => {
    const store = makeStore([
      /* ... */
    ])
    store.set(moveShapeCommand, { id: 'r1', dx: 5, dy: 5 })
    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Move shape')
  })

  it('is a no-op for unknown id', () => {
    const store = makeStore([])
    store.set(moveShapeCommand, { id: 'nonexistent', dx: 5, dy: 5 })
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})
```

### Pattern: Testing Undo/Redo

```ts
it('round-trips through undo/redo', () => {
  const store = makeStore([
    /* initial state */
  ])
  const before = store.get(documentAtom)

  store.set(moveShapeCommand, { id: 'r1', dx: 10, dy: 10 })
  const after = store.get(documentAtom)
  expect(after).not.toEqual(before)

  store.set(undoCommand)
  expect(store.get(documentAtom)).toEqual(before)

  store.set(redoCommand)
  expect(store.get(documentAtom)).toEqual(after)
})
```

## Layer 3: Components

Use `@testing-library/react` with a Jotai `Provider` wrapping tests.

### Test Helper

`src/test/renderWithStore.tsx`:

```tsx
import { render, type RenderResult } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import type { ReactElement } from 'react'

export type TestStore = ReturnType<typeof createStore>

export interface RenderWithStoreResult extends RenderResult {
  store: TestStore
}

export function renderWithStore(
  ui: ReactElement,
  seed?: (store: TestStore) => void,
): RenderWithStoreResult {
  const store = createStore()
  seed?.(store)
  const utils = render(<Provider store={store}>{ui}</Provider>)
  return { ...utils, store }
}
```

A `renderHookWithStore` companion (same signature, wraps `renderHook`) lives next to it for hook tests.

### Example: Properties Editor

```tsx
import { screen, fireEvent } from '@testing-library/react'
import { renderWithStore } from '@/test/renderWithStore'

it('updates fill color on input', async () => {
  const { store } = renderWithStore(<PropertiesPanel />, (s) => {
    s.set(documentAtom, {
      /* doc with one shape */
    })
    s.set(selectedIdsAtom, ['r1'])
  })

  const fillInput = screen.getByLabelText('Fill')
  fireEvent.change(fillInput, { target: { value: '#ff0000' } })

  expect(store.get(documentAtom).shapes[0].fill).toBe('#ff0000')
})
```

**Rule:** Component tests should assert **observable behavior** (store state changed, text appeared), not implementation details (which atom was called).

## Layer 4: Export / Golden Files

SVG export is where snapshot testing shines — the output is deterministic and meaningful.

### Golden File Pattern

`src/features/export/__fixtures__/single-rect.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="#000"/></svg>
```

`src/features/export/export.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { serializeDocument } from './serialize'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8').trim()
}

describe('serializeDocument', () => {
  it('serializes a single rect', () => {
    const doc: Document = {
      id: 'd',
      name: 't',
      viewBox: [0, 0, 24, 24],
      shapes: [
        {
          type: 'rect',
          id: 'r1',
          name: 'r',
          visible: true,
          locked: false,
          x: 2,
          y: 2,
          width: 20,
          height: 20,
          fill: '#000',
        },
      ],
    }
    expect(serializeDocument(doc)).toBe(loadFixture('single-rect.svg'))
  })
})
```

### What to Cover in Export Tests

- Each shape type in isolation
- Combined document with multiple shape types
- Style serialization (fill, stroke, dash arrays)
- Transform handling
- Empty document
- Very small numbers (precision)
- SVGO-optimized vs unoptimized output

## Layer 5: End-to-End (Playwright)

Reserve Playwright for flows that cross boundaries: real browser, real pointer events, real file downloads.

### Example: Draw-Move-Export Flow

`e2e/draw-and-export.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('draws a rect, moves it, exports valid SVG', async ({ page }) => {
  await page.goto('/')

  // Select rect tool
  await page.getByRole('button', { name: 'Rectangle' }).click()

  // Draw on canvas
  const canvas = page.locator('svg.canvas')
  await canvas.click({ position: { x: 100, y: 100 } })
  await canvas.click({ position: { x: 200, y: 200 } })

  // Move it
  const handle = canvas.locator('[data-shape-id]').first()
  await handle.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })

  // Export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export SVG' }).click(),
  ])

  const path = await download.path()
  const content = await import('node:fs').then((fs) => fs.readFileSync(path, 'utf-8'))
  expect(content).toMatch(/<rect/)
  expect(content).toMatch(/viewBox="/)
})
```

### Visual Regression

Playwright can capture screenshots:

```ts
await expect(canvas).toHaveScreenshot('rect-drawn.png', {
  maxDiffPixels: 10, // tolerate anti-aliasing jitter
})
```

Store baselines in `e2e/__screenshots__/`. Regenerate with `--update-snapshots`.

## SVG-Specific Testing Tips

### Parse, Don't String-Match

When validating SVG output, parse it — string comparison is fragile:

```ts
import { parseSvg } from '@/lib/svg/parse'

it('produces valid SVG', () => {
  const output = serializeDocument(doc)
  const parsed = parseSvg(output)
  expect(parsed.viewBox).toEqual([0, 0, 24, 24])
  expect(parsed.shapes).toHaveLength(3)
})
```

String comparison is fine for golden files (where we control every byte) but not for assertions about structure.

### Round-Trip Tests

A strong invariant: **serialize → parse → serialize should be stable.**

```ts
it('round-trips through serialize/parse', () => {
  const once = serializeDocument(doc)
  const parsed = parseDocument(once)
  const twice = serializeDocument(parsed)
  expect(twice).toBe(once)
})
```

If this fails, either serialization is lossy or parsing is lossy. Both are bugs.

### Numeric Precision

SVG coordinates are floats. Use `toBeCloseTo` for computed values:

```ts
expect(bbox.width).toBeCloseTo(10.0, 5)
```

Only assert exact equality when the math is integer (explicit input values, no transforms).

## Running Tests

```bash
pnpm test              # Vitest watch mode
pnpm test run          # Single run (CI-style)
pnpm test:e2e          # Playwright headless
pnpm test:e2e --headed # Watch it happen
pnpm test:e2e --ui     # Playwright UI mode
```

## Coverage Expectations

- **`lib/`**: 95%+ line coverage. Pure functions are cheap to test.
- **Commands**: 90%+ — every command should have at least a "happy path" and a "no-op" test.
- **Components**: 70%+ — don't chase 100%, test the logic not the markup.
- **E2E**: coverage isn't meaningful here; aim for "every critical user journey has at least one test".

## Anti-Patterns

- ❌ **Don't test Jotai itself.** `useAtomValue` works. Test what YOU wrote.
- ❌ **Don't use `waitFor` without a reason.** If you need it in a unit test, the code is probably doing something async that should be explicit.
- ❌ **Don't mock the store.** Use a real `createStore()` with seeded state — it's just as easy and far more realistic.
- ❌ **Don't snapshot React component trees.** They're noisy and break on trivial changes. Snapshot the SVG output instead.
- ❌ **Don't skip tests with `.skip` "temporarily".** Either delete the test or fix it. Skipped tests rot.

## CI

`pnpm check` runs:

1. `tsc --noEmit` (types)
2. `eslint` (lint)
3. `prettier --check` (formatting)
4. `vitest run --project unit` (unit + component)

E2E runs separately via `pnpm test:e2e` in a parallel CI job with a built dev server. See `.github/workflows/ci.yml`.
