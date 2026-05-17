import { describe, expect, it } from 'vitest'

import { isSelectable } from './selection'

describe('isSelectable', () => {
  it('returns true when visible and not locked', () => {
    expect(isSelectable({ visible: true, locked: false })).toBe(true)
  })

  it('returns false when locked', () => {
    expect(isSelectable({ visible: true, locked: true })).toBe(false)
  })

  it('returns false when hidden', () => {
    expect(isSelectable({ visible: false, locked: false })).toBe(false)
  })

  it('returns false when both hidden and locked', () => {
    expect(isSelectable({ visible: false, locked: true })).toBe(false)
  })
})
