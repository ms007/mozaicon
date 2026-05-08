import { describe, expect, it } from 'vitest'

import type { ShortcutBinding } from './registry'
import { buildBindings } from './registry'

/** Helper to create a minimal ShortcutBinding. */
function binding(
  overrides: Partial<ShortcutBinding> & Pick<ShortcutBinding, 'id' | 'key'>,
): ShortcutBinding {
  return {
    label: overrides.id,
    hint: overrides.key.toUpperCase(),
    run: () => undefined,
    ...overrides,
  }
}

describe('buildBindings — duplicate-binding assertion', () => {
  it('throws when two bindings share the same key and modifiers', () => {
    const bindings = [
      binding({ id: 'tool.rect', key: 'r' }),
      binding({ id: 'tool.rotate', key: 'r' }),
    ]
    expect(() => buildBindings(bindings)).toThrow(/collision/i)
  })

  it('error message names both binding ids', () => {
    const bindings = [
      binding({ id: 'tool.rect', key: 'r' }),
      binding({ id: 'tool.rotate', key: 'r' }),
    ]
    expect(() => buildBindings(bindings)).toThrow('tool.rect')
    expect(() => buildBindings(bindings)).toThrow('tool.rotate')
  })

  it('error message includes the conflicting key', () => {
    const bindings = [binding({ id: 'a', key: 'r' }), binding({ id: 'b', key: 'r' })]
    expect(() => buildBindings(bindings)).toThrow(/\br\b/)
  })

  it('treats key comparison as case-insensitive (r vs R)', () => {
    const bindings = [binding({ id: 'lower', key: 'r' }), binding({ id: 'upper', key: 'R' })]
    expect(() => buildBindings(bindings)).toThrow(/collision/i)
  })

  it('treats modifier order as irrelevant ([mod, shift] vs [shift, mod])', () => {
    const bindings = [
      binding({ id: 'first', key: 'z', modifiers: ['mod', 'shift'] }),
      binding({ id: 'second', key: 'z', modifiers: ['shift', 'mod'] }),
    ]
    expect(() => buildBindings(bindings)).toThrow(/collision/i)
  })

  it('does not throw when bindings share key but have different modifiers', () => {
    const bindings = [
      binding({ id: 'plain', key: 'r' }),
      binding({ id: 'with-mod', key: 'r', modifiers: ['mod'] }),
      binding({ id: 'with-shift', key: 'r', modifiers: ['shift'] }),
      binding({ id: 'with-mod-shift', key: 'r', modifiers: ['mod', 'shift'] }),
    ]
    expect(() => buildBindings(bindings)).not.toThrow()
  })

  it('treats duplicate modifiers as equivalent to single ([mod, mod] vs [mod])', () => {
    const bindings = [
      binding({ id: 'single', key: 'z', modifiers: ['mod'] }),
      binding({ id: 'duped', key: 'z', modifiers: ['mod', 'mod'] }),
    ]
    expect(() => buildBindings(bindings)).toThrow(/collision/i)
  })

  it('treats undefined modifiers and empty array as equivalent', () => {
    const bindings = [
      binding({ id: 'no-mods', key: 'r' }),
      binding({ id: 'empty-mods', key: 'r', modifiers: [] }),
    ]
    expect(() => buildBindings(bindings)).toThrow(/collision/i)
  })

  it('returns the input array unchanged when no collisions', () => {
    const bindings = [
      binding({ id: 'tool.rect', key: 'r' }),
      binding({ id: 'tool.ellipse', key: 'e' }),
    ]
    expect(buildBindings(bindings)).toBe(bindings)
  })
})
