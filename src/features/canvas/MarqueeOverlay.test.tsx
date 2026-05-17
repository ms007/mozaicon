import { describe, expect, it } from 'vitest'

import { MarqueeOverlay } from '@/features/canvas/MarqueeOverlay'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { makeMarqueeDraft } from '@/test/fixtures/marquee'
import { renderWithStore, type TestStore } from '@/test/renderWithStore'

const draftAt23to87 = makeMarqueeDraft({
  startViewBox: { x: 2, y: 3 },
  current: { x: 8, y: 7 },
})

function renderMarquee(seed?: (store: TestStore) => void) {
  return renderWithStore(
    <svg>
      <MarqueeOverlay />
    </svg>,
    seed,
  )
}

describe('MarqueeOverlay', () => {
  it('renders nothing when marqueeDraftAtom is null', () => {
    const { container } = renderMarquee()
    expect(container.querySelector('[data-testid="marquee-overlay"]')).toBeNull()
  })

  it('renders a rect with correct position and dimensions when draft is active', () => {
    const { container } = renderMarquee((store) => {
      store.set(marqueeDraftAtom, draftAt23to87)
    })

    const rect = container.querySelector('[data-testid="marquee-overlay"]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('2')
    expect(rect?.getAttribute('y')).toBe('3')
    expect(rect?.getAttribute('width')).toBe('6')
    expect(rect?.getAttribute('height')).toBe('4')
  })

  it('has non-scaling-stroke and pointerEvents none', () => {
    const { container } = renderMarquee((store) => {
      store.set(marqueeDraftAtom, draftAt23to87)
    })

    const rect = container.querySelector('[data-testid="marquee-overlay"]')
    expect(rect?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    expect(rect?.getAttribute('pointer-events')).toBe('none')
  })

  it('uses stroke-primary class', () => {
    const { container } = renderMarquee((store) => {
      store.set(marqueeDraftAtom, draftAt23to87)
    })

    const rect = container.querySelector('[data-testid="marquee-overlay"]')
    expect(rect?.classList.contains('stroke-primary')).toBe(true)
  })
})
