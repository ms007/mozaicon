import { renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { type PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { draftShapeAtom } from '@/store/atoms/draft'
import { undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import type { Document, RectShape } from '@/types/shapes'

import { createCanvasBindings } from '../canvas/bindings'
import { createHistoryBindings } from '../history/bindings'
import { createToolbarBindings } from '../toolbar/bindings'
import type { ShortcutBinding } from './registry'
import { buildBindings } from './registry'
import { useGlobalShortcuts } from './useGlobalShortcuts'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeRect(id: string): RectShape {
  return {
    type: 'rect',
    id,
    name: 'Rect',
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    corners: DEFAULT_CORNERS,
  }
}

function makeStore(doc: Document = emptyDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

function fireKey(key: string, opts: Partial<KeyboardEventInit> & { target?: EventTarget } = {}) {
  const { target, ...init } = opts
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  if (target) {
    Object.defineProperty(event, 'target', { value: target })
  }
  window.dispatchEvent(event)
  return event
}

function setup(opts?: { bindings?: ShortcutBinding[]; doc?: Document }) {
  const store = makeStore(opts?.doc)
  const resolved =
    opts?.bindings ??
    buildBindings([
      ...createCanvasBindings(store),
      ...createToolbarBindings(store),
      ...createHistoryBindings(store),
    ])
  const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>
  const { unmount } = renderHook(
    () => {
      useGlobalShortcuts(resolved)
    },
    { wrapper },
  )
  return { store, unmount }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useGlobalShortcuts', () => {
  it('pressing R activates the rect tool but does not add a shape', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    fireKey('r')

    expect(store.get(activeToolAtom)).toBe('rect')
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('pressing R with Ctrl does not dispatch (browser reload)', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    fireKey('r', { ctrlKey: true })

    expect(store.get(activeToolAtom)).toBe('select')
  })

  it('pressing R with Meta does not dispatch', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    fireKey('r', { metaKey: true })

    expect(store.get(activeToolAtom)).toBe('select')
  })

  it('does not dispatch single-key bindings when target is an editable element', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      fireKey('r', { target: input })
      expect(store.get(activeToolAtom)).toBe('select')
    } finally {
      input.remove()
    }
  })

  it('dispatches bypassEditable bindings when target is an editable element', () => {
    const handler = vi.fn()
    const bindings: ShortcutBinding[] = [
      {
        id: 'chord',
        key: 'e',
        modifiers: ['mod', 'shift'],
        label: 'Chord',
        hint: 'Ctrl+Shift+E',
        bypassEditable: true,
        run: handler,
      },
    ]
    setup({ bindings })

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      fireKey('e', { ctrlKey: true, shiftKey: true, target: input })
      expect(handler).toHaveBeenCalledOnce()
    } finally {
      input.remove()
    }
  })

  it('suppresses modifier-chord bindings without bypassEditable in editable elements', () => {
    const handler = vi.fn()
    const bindings: ShortcutBinding[] = [
      {
        id: 'undo',
        key: 'z',
        modifiers: ['mod'],
        label: 'Undo',
        hint: 'Ctrl+Z',
        run: handler,
      },
    ]
    setup({ bindings })

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      const event = fireKey('z', { ctrlKey: true, target: input })
      expect(handler).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    } finally {
      input.remove()
    }
  })

  it('a suppressed non-bypass binding does not shadow a later bypassEditable one', () => {
    const first = vi.fn()
    const second = vi.fn()
    const bindings: ShortcutBinding[] = [
      {
        id: 'first',
        key: 'e',
        modifiers: ['mod', 'shift'],
        label: 'First',
        hint: 'Ctrl+Shift+E',
        run: first,
      },
      {
        id: 'second',
        key: 'e',
        modifiers: ['mod', 'shift'],
        label: 'Second',
        hint: 'Ctrl+Shift+E',
        bypassEditable: true,
        run: second,
      },
    ]
    setup({ bindings })

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      fireKey('e', { ctrlKey: true, shiftKey: true, target: input })
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledOnce()
    } finally {
      input.remove()
    }
  })

  it('does not dispatch shift-only bindings from an editable element', () => {
    const handler = vi.fn()
    const bindings: ShortcutBinding[] = [
      {
        id: 'shift-only',
        key: 'x',
        modifiers: ['shift'],
        label: 'Shift only',
        hint: 'Shift+X',
        run: handler,
      },
    ]
    setup({ bindings })

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      const event = fireKey('x', { shiftKey: true, target: input })
      expect(handler).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    } finally {
      input.remove()
    }
  })

  it('does not dispatch on event.repeat', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    fireKey('r', { repeat: true })

    expect(store.get(activeToolAtom)).toBe('select')
  })

  it('calls preventDefault on a matched binding', () => {
    setup()
    const event = fireKey('r')
    expect(event.defaultPrevented).toBe(true)
  })

  it('does NOT call preventDefault on an unmatched key', () => {
    setup()
    const event = fireKey('x')
    expect(event.defaultPrevented).toBe(false)
  })

  it('does NOT call preventDefault on Ctrl+R', () => {
    setup()
    const event = fireKey('r', { ctrlKey: true })
    expect(event.defaultPrevented).toBe(false)
  })

  it('removes the keydown listener on unmount', () => {
    const { store, unmount } = setup()
    store.set(activeToolAtom, 'select')
    unmount()

    fireKey('r')

    expect(store.get(activeToolAtom)).toBe('select')
  })

  it('dispatches first-match-wins when multiple bindings share a prefix', () => {
    const first = vi.fn()
    const second = vi.fn()
    const bindings: ShortcutBinding[] = [
      { id: 'first', key: 'x', label: 'First', hint: 'X', run: first },
      { id: 'second', key: 'y', label: 'Second', hint: 'Y', run: second },
    ]
    setup({ bindings })

    fireKey('x')
    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })

  it('pressing Escape clears the active tool', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'rect')

    fireKey('Escape')

    expect(store.get(activeToolAtom)).toBeNull()
  })

  it('pressing Escape mid-drag cancels the draft without clearing the tool', () => {
    const draft: RectShape = {
      type: 'rect',
      id: '__draft__',
      name: 'Rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 5,
      height: 5,
      fill: '#000',
      corners: DEFAULT_CORNERS,
    }
    const { store } = setup()
    store.set(activeToolAtom, 'rect')
    store.set(draftShapeAtom, draft)

    fireKey('Escape')

    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(activeToolAtom)).toBe('rect')
  })

  it('pressing R after Escape re-activates the rect tool', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'rect')

    fireKey('Escape')
    expect(store.get(activeToolAtom)).toBeNull()

    fireKey('r')
    expect(store.get(activeToolAtom)).toBe('rect')
  })

  describe('Delete / Backspace', () => {
    it('pressing Delete removes all selected shapes', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a'), makeRect('b')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a', 'b'])

      fireKey('Delete')

      expect(store.get(documentAtom).shapes).toHaveLength(0)
      expect(store.get(selectedIdsAtom)).toEqual([])
    })

    it('pressing Backspace removes all selected shapes', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a'])

      fireKey('Backspace')

      expect(store.get(documentAtom).shapes).toHaveLength(0)
      expect(store.get(selectedIdsAtom)).toEqual([])
    })

    it('is a no-op with empty selection — no history entry', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a')] }
      const { store } = setup({ doc })

      fireKey('Delete')

      expect(store.get(documentAtom).shapes).toHaveLength(1)
      expect(store.get(undoStackAtom)).toHaveLength(0)
    })

    it('deletion is undoable and restores prior selection', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a'])

      fireKey('Delete')
      expect(store.get(documentAtom).shapes).toHaveLength(0)

      fireKey('z', { ctrlKey: true })

      expect(store.get(documentAtom).shapes).toHaveLength(1)
      expect(store.get(selectedIdsAtom)).toEqual(['a'])
    })

    it('does not fire while an input is focused', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a'])

      const input = document.createElement('input')
      document.body.appendChild(input)
      try {
        fireKey('Backspace', { target: input })
        expect(store.get(documentAtom).shapes).toHaveLength(1)
      } finally {
        input.remove()
      }
    })

    it('deleting a subset leaves remaining shapes intact', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a'), makeRect('b'), makeRect('c')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a', 'c'])

      fireKey('Delete')

      const shapes = store.get(documentAtom).shapes
      expect(shapes).toHaveLength(1)
      expect(shapes[0].id).toBe('b')
    })

    it('pushes exactly one history entry per deletion', () => {
      const doc = { ...emptyDoc, shapes: [makeRect('a'), makeRect('b')] }
      const { store } = setup({ doc })
      store.set(restoreSelectionAtom, ['a', 'b'])

      fireKey('Delete')

      expect(store.get(undoStackAtom)).toHaveLength(1)
    })
  })
})
