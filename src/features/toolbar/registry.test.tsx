import { describe, expect, it } from 'vitest'

import { DRAW_TOOL_MAP, getToolById, getToolDescriptors } from './registry'

describe('tool registry', () => {
  it('contains at least one tool', () => {
    expect(getToolDescriptors().length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const descriptors = getToolDescriptors()
    const ids = descriptors.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique hotkeys', () => {
    const descriptors = getToolDescriptors()
    const hotkeys = descriptors.map((t) => t.hotkey)
    expect(new Set(hotkeys).size).toBe(hotkeys.length)
  })

  it('id-keyed lookup matches the canonical list', () => {
    const descriptors = getToolDescriptors()
    for (const t of descriptors) {
      expect(getToolById(t.id)).toBe(t)
    }
  })

  it('getToolById returns undefined for an unknown id', () => {
    expect(getToolById('nonexistent')).toBeUndefined()
  })

  it('draw tool map contains an entry for every descriptor', () => {
    const descriptors = getToolDescriptors()
    for (const t of descriptors) {
      expect(DRAW_TOOL_MAP[t.id]).toBe(t.drawTool)
    }
  })

  it('draw tool map has no extra entries', () => {
    const descriptors = getToolDescriptors()
    expect(Object.keys(DRAW_TOOL_MAP)).toHaveLength(descriptors.length)
  })
})
