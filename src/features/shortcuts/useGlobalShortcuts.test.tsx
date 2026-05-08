import { renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { type PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeToolAtom } from '@/store/atoms/tool'
import type { Document } from '@/types/shapes'

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

function setup(bindings?: ShortcutBinding[]) {
  const store = makeStore()
  const resolved = bindings ?? buildBindings(createToolbarBindings(store))
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
  it('pressing R dispatches the rect action and updates atoms', () => {
    const { store } = setup()
    store.set(activeToolAtom, 'select')

    fireKey('r')

    expect(store.get(activeToolAtom)).toBe('rect')
    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect' })
  })

  it('pressing R with Ctrl does not dispatch (browser reload)', () => {
    const { store } = setup()
    fireKey('r', { ctrlKey: true })
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('pressing R with Meta does not dispatch', () => {
    const { store } = setup()
    fireKey('r', { metaKey: true })
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('does not dispatch when target is an editable element', () => {
    const { store } = setup()

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      fireKey('r', { target: input })
      expect(store.get(documentAtom).shapes).toHaveLength(0)
    } finally {
      input.remove()
    }
  })

  it('does not dispatch on event.repeat', () => {
    const { store } = setup()
    fireKey('r', { repeat: true })
    expect(store.get(documentAtom).shapes).toHaveLength(0)
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
    unmount()

    fireKey('r')
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('dispatches first-match-wins when multiple bindings share a prefix', () => {
    const first = vi.fn()
    const second = vi.fn()
    const bindings: ShortcutBinding[] = [
      { id: 'first', key: 'x', label: 'First', hint: 'X', run: first },
      { id: 'second', key: 'y', label: 'Second', hint: 'Y', run: second },
    ]
    setup(bindings)

    fireKey('x')
    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })
})
