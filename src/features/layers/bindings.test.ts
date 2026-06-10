import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { buildBindings } from '@/features/shortcuts/registry'
import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'
import type { Icon, RectShape } from '@/types/shapes'

import { createLayerBindings } from './bindings'

/* ── helpers for reorder binding tests ── */

function findBinding(store: ReturnType<typeof createStore>, id: string) {
  const binding = createLayerBindings(store).find((b) => b.id === id)
  if (!binding) throw new Error(`Binding "${id}" not found`)
  return binding
}

function makeInlineRect(id: string): RectShape {
  return {
    type: 'rect',
    id,
    name: id,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    corners: DEFAULT_CORNERS,
  }
}

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [makeInlineRect('a'), makeInlineRect('b'), makeInlineRect('c')],
}

function makeReorderStore() {
  const store = createStore()
  store.set(activeIconAtom, testDoc)
  return store
}

/* ── reorder bindings (issue #180): bringForward / sendBackward ── */

describe('reorder layer bindings', () => {
  it('registers all four bindings without collisions', () => {
    const store = makeReorderStore()
    const bindings = createLayerBindings(store)

    expect(bindings).toHaveLength(4)
    expect(bindings.map((b) => b.id)).toEqual([
      'layers.bringForward',
      'layers.sendBackward',
      'layers.bringToFront',
      'layers.sendToBack',
    ])
    expect(() => buildBindings(bindings)).not.toThrow()
  })

  it('bringForward binding uses mod+] key combo', () => {
    const store = makeReorderStore()
    const forward = findBinding(store, 'layers.bringForward')

    expect(forward.key).toBe(']')
    expect(forward.modifiers).toEqual(['mod'])
  })

  it('sendBackward binding uses mod+[ key combo', () => {
    const store = makeReorderStore()
    const backward = findBinding(store, 'layers.sendBackward')

    expect(backward.key).toBe('[')
    expect(backward.modifiers).toEqual(['mod'])
  })

  it('bringForward run() dispatches the reorder command', () => {
    const store = makeReorderStore()
    store.set(restoreSelectionAtom, ['a'])

    findBinding(store, 'layers.bringForward').run()

    expect(store.get(activeIconAtom).shapes.map((s) => s.id)).toEqual(['b', 'a', 'c'])
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('sendBackward run() dispatches the reorder command', () => {
    const store = makeReorderStore()
    store.set(restoreSelectionAtom, ['c'])

    findBinding(store, 'layers.sendBackward').run()

    expect(store.get(activeIconAtom).shapes.map((s) => s.id)).toEqual(['a', 'c', 'b'])
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('run() is a no-op when nothing is selected', () => {
    const store = makeReorderStore()

    findBinding(store, 'layers.bringForward').run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})

/* ── helpers for block-move binding tests ── */

const a = makeRect({ id: 'a', name: 'A' })
const b = makeRect({ id: 'b', name: 'B' })
const c = makeRect({ id: 'c', name: 'C' })
const d = makeRect({ id: 'd', name: 'D' })
const aLocked = makeRect({ id: 'a', name: 'A', locked: true })

function ids(store: ReturnType<typeof createStore>): string[] {
  return store.get(activeIconAtom).shapes.map((s) => s.id)
}

function setup(shapes = [a, b, c, d]) {
  const store = createStore()
  store.set(activeIconAtom, makeIcon(shapes))
  const bindings = createLayerBindings(store)
  const bringToFront = bindings.find((b) => b.id === 'layers.bringToFront')
  if (!bringToFront) throw new Error('No bringToFront binding found')
  const sendToBack = bindings.find((b) => b.id === 'layers.sendToBack')
  if (!sendToBack) throw new Error('No sendToBack binding found')
  return { store, bringToFront, sendToBack }
}

/* ── block-move bindings (issue #181): bringToFront / sendToBack ── */

describe('layers.bringToFront binding', () => {
  it('has correct key and modifiers', () => {
    const { bringToFront } = setup()
    expect(bringToFront.key).toBe(']')
    expect(bringToFront.code).toBe('BracketRight')
    expect(bringToFront.modifiers).toEqual(['mod', 'alt'])
  })

  it('moves selection to the front', () => {
    const { store, bringToFront } = setup()
    seedSelection(store, ['a'])

    bringToFront.run()

    expect(ids(store)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('is a no-op with empty selection', () => {
    const { store, bringToFront } = setup()

    bringToFront.run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when already at front', () => {
    const { store, bringToFront } = setup()
    seedSelection(store, ['d'])

    bringToFront.run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('collapses non-contiguous selection preserving relative order', () => {
    const { store, bringToFront } = setup()
    seedSelection(store, ['a', 'c'])

    bringToFront.run()

    expect(ids(store)).toEqual(['b', 'd', 'a', 'c'])
  })
})

describe('layers.sendToBack binding', () => {
  it('has correct key and modifiers', () => {
    const { sendToBack } = setup()
    expect(sendToBack.key).toBe('[')
    expect(sendToBack.code).toBe('BracketLeft')
    expect(sendToBack.modifiers).toEqual(['mod', 'alt'])
  })

  it('moves selection to the back', () => {
    const { store, sendToBack } = setup()
    seedSelection(store, ['d'])

    sendToBack.run()

    expect(ids(store)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('is a no-op with empty selection', () => {
    const { store, sendToBack } = setup()

    sendToBack.run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when already at back', () => {
    const { store, sendToBack } = setup()
    seedSelection(store, ['a'])

    sendToBack.run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('collapses non-contiguous selection preserving relative order', () => {
    const { store, sendToBack } = setup()
    seedSelection(store, ['b', 'd'])

    sendToBack.run()

    expect(ids(store)).toEqual(['b', 'd', 'a', 'c'])
  })
})

describe('undo restores order and selection', () => {
  it('Cmd+Z after bring-to-front restores original order and selection', () => {
    const { store, bringToFront } = setup()
    seedSelection(store, ['a'])

    bringToFront.run()
    expect(ids(store)).toEqual(['b', 'c', 'd', 'a'])

    store.set(undoCommand)

    expect(ids(store)).toEqual(['a', 'b', 'c', 'd'])
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('Cmd+Z after send-to-back restores original order and selection', () => {
    const { store, sendToBack } = setup()
    seedSelection(store, ['d'])

    sendToBack.run()
    expect(ids(store)).toEqual(['d', 'a', 'b', 'c'])

    store.set(undoCommand)

    expect(ids(store)).toEqual(['a', 'b', 'c', 'd'])
    expect(store.get(selectedIdsAtom)).toEqual(['d'])
  })
})

describe('locked shapes as fixed anchors', () => {
  it('locked shapes stay in place when bring-to-front', () => {
    const { store, bringToFront } = setup([aLocked, b, c])
    seedSelection(store, ['a', 'b'])

    bringToFront.run()

    expect(ids(store)).toEqual(['a', 'c', 'b'])
  })

  it('locked shapes stay in place when send-to-back', () => {
    const { store, sendToBack } = setup([aLocked, b, c])
    seedSelection(store, ['a', 'b'])

    sendToBack.run()

    expect(ids(store)).toEqual(['b', 'a', 'c'])
  })

  it('all-locked selection is a no-op', () => {
    const { store, bringToFront } = setup([aLocked, b, c])
    seedSelection(store, ['a'])

    bringToFront.run()

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})
