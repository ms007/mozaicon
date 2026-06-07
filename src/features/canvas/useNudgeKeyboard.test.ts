import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { moveDraftAtom } from '@/store/atoms/gestures/move'
import { nudgeDraftAtom } from '@/store/atoms/gestures/nudge'
import { undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'
import type { Document } from '@/types/shapes'

import { useNudgeKeyboard } from './useNudgeKeyboard'

const testDoc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5 }),
])

const lockedDoc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5, locked: true }),
])

const hiddenDoc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5, visible: false }),
])

const allLockedDoc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5, locked: true }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5, locked: true }),
])

function fireKey(type: 'keydown' | 'keyup', key: string, extra: Partial<KeyboardEvent> = {}) {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...extra,
  })
  const target = document.activeElement ?? document.body
  target.dispatchEvent(event)
}

function setup(selectedIds: string[] = ['a'], doc: Document = testDoc) {
  const { store } = renderHookWithStore(
    () => {
      useNudgeKeyboard()
    },
    (s) => {
      s.set(documentAtom, doc)
      if (selectedIds.length > 0) {
        s.set(restoreSelectionAtom, selectedIds)
      }
    },
  )
  return store
}

describe('useNudgeKeyboard', () => {
  it('moves a shape by 1 unit on a single ArrowRight tap', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(1)
    expect(a?.y).toBe(0)
  })

  it('maps Up=-y, Down=+y, Left=-x, Right=+x', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowUp')
      fireKey('keyup', 'ArrowUp')
    })

    let a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(-1)

    act(() => {
      fireKey('keydown', 'ArrowDown')
      fireKey('keyup', 'ArrowDown')
    })

    a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.y).toBe(0)

    act(() => {
      fireKey('keydown', 'ArrowLeft')
      fireKey('keyup', 'ArrowLeft')
    })

    a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(-1)
  })

  it('accumulates auto-repeat keydowns into one undo step', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(3)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Move selection')
  })

  it('moves multiple selected shapes by the same delta', () => {
    const store = setup(['a', 'b'])

    act(() => {
      fireKey('keydown', 'ArrowDown')
      fireKey('keydown', 'ArrowDown')
      fireKey('keyup', 'ArrowDown')
    })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    const b = doc.shapes.find((s) => s.id === 'b')
    expect(a?.y).toBe(2)
    expect(b?.y).toBe(12)
  })

  it('is a no-op when selection is empty', () => {
    const store = setup([])

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(nudgeDraftAtom)).toBeNull()
  })

  it('does not nudge when an editable element is focused', () => {
    const store = setup()

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    try {
      act(() => {
        fireKey('keydown', 'ArrowRight')
        fireKey('keyup', 'ArrowRight')
      })

      expect(store.get(undoStackAtom)).toHaveLength(0)
    } finally {
      document.body.removeChild(input)
    }
  })

  it('does not nudge when a textarea is focused', () => {
    const store = setup()

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    try {
      act(() => {
        fireKey('keydown', 'ArrowRight')
        fireKey('keyup', 'ArrowRight')
      })

      expect(store.get(undoStackAtom)).toHaveLength(0)
    } finally {
      document.body.removeChild(textarea)
    }
  })

  it('does not nudge when a contentEditable element is focused', () => {
    const store = setup()

    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    div.focus()

    try {
      act(() => {
        fireKey('keydown', 'ArrowRight')
        fireKey('keyup', 'ArrowRight')
      })

      expect(store.get(undoStackAtom)).toHaveLength(0)
    } finally {
      document.body.removeChild(div)
    }
  })

  it('sets nudgeDraftAtom during the run and clears it on commit', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 1, dy: 0 })

    act(() => {
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 2, dy: 0 })

    act(() => {
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
  })

  it('does not change the selection', () => {
    const store = setup(['a'])

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('cancels the in-progress nudge when the window loses focus', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 2, dy: 0 })

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op on blur when no nudge is active', () => {
    const store = setup()

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(nudgeDraftAtom)).toBeNull()
  })

  it('skips the command when opposite arrows cancel to zero delta', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowLeft')
      fireKey('keyup', 'ArrowRight')
      fireKey('keyup', 'ArrowLeft')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('Escape cancels mid-nudge without committing', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 2, dy: 0 })

    act(() => {
      fireKey('keydown', 'Escape')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('keyup after Escape does not commit the cancelled delta', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
    })

    act(() => {
      fireKey('keydown', 'Escape')
    })

    act(() => {
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('does not start a nudge while a pointer gesture is active', () => {
    const store = setup()
    store.set(moveDraftAtom, { ids: ['a'], dx: 5, dy: 5 })

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('handles multi-axis hold: commit only when all arrow keys released', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowDown')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 1, dy: 1 })

    act(() => {
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).not.toBeNull()

    act(() => {
      fireKey('keyup', 'ArrowDown')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(1)
    expect(a?.y).toBe(1)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  describe('modifier steps', () => {
    it('Shift multiplies step by 10 (coarse nudge)', () => {
      const store = setup()

      act(() => {
        fireKey('keydown', 'ArrowRight', { shiftKey: true })
        fireKey('keyup', 'ArrowRight', { shiftKey: true })
      })

      const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
      expect(a?.x).toBe(10)
      expect(a?.y).toBe(0)
    })

    it('Alt multiplies step by 0.1 (fine nudge)', () => {
      const store = setup()

      act(() => {
        fireKey('keydown', 'ArrowDown', { altKey: true })
        fireKey('keyup', 'ArrowDown', { altKey: true })
      })

      const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
      expect(a?.x).toBe(0)
      expect(a?.y).toBeCloseTo(0.1)
    })

    it('accumulates mixed modifier steps in one run', () => {
      const store = setup()

      act(() => {
        fireKey('keydown', 'ArrowRight')
        fireKey('keydown', 'ArrowRight', { shiftKey: true })
        fireKey('keydown', 'ArrowRight', { altKey: true })
        fireKey('keyup', 'ArrowRight')
      })

      const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
      expect(a?.x).toBeCloseTo(11.1)
      expect(store.get(undoStackAtom)).toHaveLength(1)
    })

    it('Shift+Alt: Shift wins (x10)', () => {
      const store = setup()

      act(() => {
        fireKey('keydown', 'ArrowLeft', { shiftKey: true, altKey: true })
        fireKey('keyup', 'ArrowLeft', { shiftKey: true, altKey: true })
      })

      const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
      expect(a?.x).toBe(-10)
    })

    it('draft atom reflects scaled delta during a Shift hold', () => {
      const store = setup()

      act(() => {
        fireKey('keydown', 'ArrowUp', { shiftKey: true })
      })

      expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 0, dy: -10 })

      act(() => {
        fireKey('keyup', 'ArrowUp', { shiftKey: true })
      })

      expect(store.get(nudgeDraftAtom)).toBeNull()
    })
  })

  it('cancels the run and restores position when Escape is pressed mid-run', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 3, dy: 0 })

    act(() => {
      fireKey('keydown', 'Escape')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('cancels the run and restores position on window blur', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowDown')
      fireKey('keydown', 'ArrowDown')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 0, dy: 2 })

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('cancels the run on visibilitychange to hidden', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowLeft')
      fireKey('keydown', 'ArrowLeft')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: -2, dy: 0 })

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(0)
    expect(store.get(undoStackAtom)).toHaveLength(0)

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  it('does not cancel on visibilitychange to visible', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
    })

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 1, dy: 0 })

    act(() => {
      fireKey('keyup', 'ArrowRight')
    })

    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(1)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('starts a fresh run after cancellation', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowRight')
    })

    act(() => {
      fireKey('keydown', 'Escape')
    })

    expect(store.get(undoStackAtom)).toHaveLength(0)

    act(() => {
      fireKey('keydown', 'ArrowDown')
      fireKey('keyup', 'ArrowDown')
    })

    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(1)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('is a no-op when Escape is pressed with no active run', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'Escape')
    })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(nudgeDraftAtom)).toBeNull()
  })

  it('ignores stale keyups after Escape cancel during multi-key hold', () => {
    const store = setup()

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keydown', 'ArrowDown')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 1, dy: 1 })

    act(() => {
      fireKey('keydown', 'Escape')
    })

    act(() => {
      fireKey('keyup', 'ArrowRight')
      fireKey('keyup', 'ArrowDown')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    expect(store.get(undoStackAtom)).toHaveLength(0)
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0)
    expect(a?.y).toBe(0)
  })

  it('excludes locked shapes from the nudge run', () => {
    const store = setup(['a', 'b'], lockedDoc)

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    const b = doc.shapes.find((s) => s.id === 'b')
    expect(a?.x).toBe(1)
    expect(b?.x).toBe(10)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('excludes hidden shapes from the nudge run', () => {
    const store = setup(['a', 'b'], hiddenDoc)

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    const b = doc.shapes.find((s) => s.id === 'b')
    expect(a?.x).toBe(1)
    expect(b?.x).toBe(10)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('blocks the run when all selected shapes are locked', () => {
    const store = setup(['a', 'b'], allLockedDoc)

    act(() => {
      fireKey('keydown', 'ArrowRight')
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    expect(store.get(undoStackAtom)).toHaveLength(0)
    const doc = store.get(documentAtom)
    expect(doc.shapes.find((s) => s.id === 'a')?.x).toBe(0)
    expect(doc.shapes.find((s) => s.id === 'b')?.x).toBe(10)
  })

  it('does not preventDefault when all selected shapes are locked', () => {
    setup(['a', 'b'], allLockedDoc)

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })

    act(() => {
      ;(document.activeElement ?? document.body).dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(false)
  })

  it('freezes the filtered id set for the entire run', () => {
    const store = setup(['a', 'b'], lockedDoc)

    act(() => {
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 1, dy: 0 })

    act(() => {
      fireKey('keydown', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toEqual({ ids: ['a'], dx: 2, dy: 0 })

    act(() => {
      fireKey('keyup', 'ArrowRight')
    })

    expect(store.get(nudgeDraftAtom)).toBeNull()
    const a = store.get(documentAtom).shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(2)
  })
})
