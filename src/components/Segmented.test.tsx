import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Segmented, type SegmentedOption } from '@/components/Segmented'
import { getPillStyle } from '@/components/segmented-pill'

const UNIT_OPTIONS: SegmentedOption[] = [
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
  { value: 'em', label: 'em' },
]

const noop = () => undefined

function pill() {
  const el = document.querySelector<HTMLElement>('[data-slot="segmented-pill"]')
  if (!el) throw new Error('Segmented pill not found')
  return el
}

describe('Segmented', () => {
  it('fires onChange with the segment value when a segment is clicked', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    await userEvent.click(screen.getByText('%'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('%')
  })

  it('swallows Radix deselection when the active segment is re-clicked', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    await userEvent.click(screen.getByText('px'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('insets the pill by the container padding so its rounded corners stay inside the rounded track', () => {
    // The container has `p-0.5` (2px) horizontal padding. The pill must mirror
    // that inset — `calc((100% - 0.25rem) * i / n + 0.125rem)` — so the active
    // segment's pill aligns with the item content instead of running flush
    // with the rounded outer edge (which clipped the pill's corners).
    expect(getPillStyle(0, 3)).toEqual({
      left: 'calc((100% - 0.25rem) * 0 / 3 + 0.125rem)',
      width: 'calc((100% - 0.25rem) / 3)',
    })
    expect(getPillStyle(1, 3).left).toBe('calc((100% - 0.25rem) * 1 / 3 + 0.125rem)')
    expect(getPillStyle(2, 3).left).toBe('calc((100% - 0.25rem) * 2 / 3 + 0.125rem)')
  })

  it('clamps the pill to the first segment when the value is not in options', () => {
    expect(getPillStyle(-1, 3).left).toBe('calc((100% - 0.25rem) * 0 / 3 + 0.125rem)')
  })

  it('applies the `duration-200 ease-out` transition on the pill', () => {
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={noop} />)
    const className = pill().className
    expect(className).toContain('duration-200')
    expect(className).toContain('ease-out')
  })

  it('hides the pill when `value` is not in options', () => {
    render(<Segmented options={UNIT_OPTIONS} value="rem" onChange={noop} />)
    expect(pill().className).toContain('opacity-0')
  })

  it('renders at the 28px compact-input height (h-7)', () => {
    const { container } = render(<Segmented options={UNIT_OPTIONS} value="px" onChange={noop} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('h-7')
  })

  it('selects the next segment via keyboard arrow navigation (inherited from ToggleGroup)', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    // Roving focus: the active item is the tab-stop. Focus it, arrow-right
    // moves focus, Space activates the newly focused item.
    const active = screen.getByText('px').closest('button')
    if (!active) throw new Error('Active segment button not found')
    active.focus()

    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith('%')
  })
})
