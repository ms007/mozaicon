import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Wordmark } from '@/components/Wordmark'

function mark() {
  const el = document.querySelector<SVGSVGElement>('[data-slot="wordmark"]')
  if (!el) throw new Error('Wordmark element not found')
  return el
}

describe('Wordmark', () => {
  it('defaults `height` to 20 and derives width from the aspect ratio', () => {
    render(<Wordmark />)
    const el = mark()
    expect(el.getAttribute('height')).toBe('20')
    expect(el.getAttribute('width')).toBe(String(Math.round(20 * (1250 / 232))))
  })

  it('scales width proportionally when `height` changes', () => {
    render(<Wordmark height={64} />)
    const el = mark()
    expect(el.getAttribute('height')).toBe('64')
    expect(el.getAttribute('width')).toBe(String(Math.round(64 * (1250 / 232))))
  })

  it('keeps the artwork viewBox so the lettering scales crisp', () => {
    render(<Wordmark />)
    expect(mark().getAttribute('viewBox')).toBe('0 0 1250 232')
  })

  it('uses `currentColor` so the mark inherits the surrounding color', () => {
    render(<Wordmark />)
    const group = mark().querySelector('g')
    expect(group?.getAttribute('fill')).toBe('currentColor')
  })
})
