import { describe, expect, it } from 'vitest'

import { isEditableTarget, matches } from './match'

// Minimal KeyboardEvent factory — only the fields we check.
function keyEvent(
  key: string,
  opts: {
    code?: string
    ctrlKey?: boolean
    metaKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    repeat?: boolean
    target?: EventTarget
  } = {},
): KeyboardEvent {
  return {
    key,
    code: opts.code ?? '',
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    repeat: opts.repeat ?? false,
    target: opts.target ?? document.body,
  } as unknown as KeyboardEvent
}

describe('matches', () => {
  it('matches a plain key with no modifiers', () => {
    expect(matches(keyEvent('r'), { key: 'r' })).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(matches(keyEvent('R'), { key: 'r' })).toBe(true)
    expect(matches(keyEvent('r'), { key: 'R' })).toBe(true)
  })

  it('rejects a different key', () => {
    expect(matches(keyEvent('e'), { key: 'r' })).toBe(false)
  })

  it('rejects when Ctrl is held on a no-modifier binding (non-Mac)', () => {
    // Simulate non-Mac: ctrlKey = primary modifier
    expect(matches(keyEvent('r', { ctrlKey: true }), { key: 'r' })).toBe(false)
  })

  it('rejects when Meta is held on a no-modifier binding', () => {
    expect(matches(keyEvent('r', { metaKey: true }), { key: 'r' })).toBe(false)
  })

  it('rejects when Shift is held on a no-modifier binding', () => {
    expect(matches(keyEvent('r', { shiftKey: true }), { key: 'r' })).toBe(false)
  })

  it('rejects when Alt is held on a no-modifier binding', () => {
    expect(matches(keyEvent('r', { altKey: true }), { key: 'r' })).toBe(false)
  })

  it('matches a binding that declares mod when Ctrl is held (non-Mac env)', () => {
    // In jsdom, navigator.platform defaults to empty string → non-Mac
    expect(matches(keyEvent('r', { ctrlKey: true }), { key: 'r', modifiers: ['mod'] })).toBe(true)
  })

  it('rejects a mod binding when no modifier is held', () => {
    expect(matches(keyEvent('r'), { key: 'r', modifiers: ['mod'] })).toBe(false)
  })

  it('rejects a mod binding with extra Shift', () => {
    expect(
      matches(keyEvent('r', { ctrlKey: true, shiftKey: true }), { key: 'r', modifiers: ['mod'] }),
    ).toBe(false)
  })

  it('treats explicit empty modifiers array same as undefined', () => {
    expect(matches(keyEvent('r'), { key: 'r', modifiers: [] })).toBe(true)
    expect(matches(keyEvent('r', { ctrlKey: true }), { key: 'r', modifiers: [] })).toBe(false)
  })

  it('matches a shift-only binding', () => {
    expect(matches(keyEvent('r', { shiftKey: true }), { key: 'r', modifiers: ['shift'] })).toBe(
      true,
    )
  })

  it('rejects a shift binding when Shift is not held', () => {
    expect(matches(keyEvent('r'), { key: 'r', modifiers: ['shift'] })).toBe(false)
  })

  it('matches a multi-modifier binding (mod+shift)', () => {
    expect(
      matches(keyEvent('r', { ctrlKey: true, shiftKey: true }), {
        key: 'r',
        modifiers: ['mod', 'shift'],
      }),
    ).toBe(true)
  })

  it('rejects a multi-modifier binding when only one modifier is held', () => {
    expect(
      matches(keyEvent('r', { ctrlKey: true }), { key: 'r', modifiers: ['mod', 'shift'] }),
    ).toBe(false)
    expect(
      matches(keyEvent('r', { shiftKey: true }), { key: 'r', modifiers: ['mod', 'shift'] }),
    ).toBe(false)
  })

  it('matches mod+alt+] when key stays "]" (non-glyph layout)', () => {
    expect(
      matches(keyEvent(']', { ctrlKey: true, altKey: true }), {
        key: ']',
        modifiers: ['mod', 'alt'],
      }),
    ).toBe(true)
  })

  it('matches mod+alt+] via code when Option composes a glyph (macOS)', () => {
    // On macOS, Option+] yields event.key === "'" but event.code === "BracketRight".
    expect(
      matches(keyEvent("'", { code: 'BracketRight', ctrlKey: true, altKey: true }), {
        key: ']',
        code: 'BracketRight',
        modifiers: ['mod', 'alt'],
      }),
    ).toBe(true)
  })

  it('matches mod+alt+[ via code when Option composes a glyph (macOS)', () => {
    expect(
      matches(keyEvent('“', { code: 'BracketLeft', ctrlKey: true, altKey: true }), {
        key: '[',
        code: 'BracketLeft',
        modifiers: ['mod', 'alt'],
      }),
    ).toBe(true)
  })

  it('still rejects a non-matching key even when a code is declared', () => {
    expect(matches(keyEvent('x', { code: 'KeyX' }), { key: ']', code: 'BracketRight' })).toBe(false)
  })

  it('rejects mod+alt binding when Alt is not held', () => {
    expect(matches(keyEvent(']', { ctrlKey: true }), { key: ']', modifiers: ['mod', 'alt'] })).toBe(
      false,
    )
  })

  it('rejects when both primary and other meta are held (non-Mac)', () => {
    // ctrlKey + metaKey on non-Mac: ctrl is primary, meta is "other" → rejected
    expect(
      matches(keyEvent('r', { ctrlKey: true, metaKey: true }), { key: 'r', modifiers: ['mod'] }),
    ).toBe(false)
  })
})

describe('isEditableTarget', () => {
  it('returns true for <input>', () => {
    const el = document.createElement('input')
    expect(isEditableTarget(el)).toBe(true)
  })

  it('returns true for <textarea>', () => {
    const el = document.createElement('textarea')
    expect(isEditableTarget(el)).toBe(true)
  })

  it('returns true for <select>', () => {
    const el = document.createElement('select')
    expect(isEditableTarget(el)).toBe(true)
  })

  it('returns true for [contenteditable]', () => {
    const el = document.createElement('div')
    el.setAttribute('contenteditable', 'true')
    expect(isEditableTarget(el)).toBe(true)
  })

  it('returns false for a plain <div>', () => {
    const el = document.createElement('div')
    expect(isEditableTarget(el)).toBe(false)
  })

  it('returns false for null target', () => {
    expect(isEditableTarget(null)).toBe(false)
  })

  it('returns false for non-HTMLElement targets', () => {
    expect(isEditableTarget(document)).toBe(false)
  })
})
