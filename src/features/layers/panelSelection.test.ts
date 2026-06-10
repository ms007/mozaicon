import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { clearSelectionCommand } from '@/store/commands/selectionCommands'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'
import type { Icon } from '@/types/shapes'

import { selectFromPanelAtom, selectionAnchorAtom } from './panelSelection'

const testDoc = makeIcon([
  makeRect({ id: 'a', name: 'A' }),
  makeRect({ id: 'b', name: 'B', x: 5, y: 5 }),
  makeRect({ id: 'c', name: 'C', x: 10, y: 10 }),
  makeRect({ id: 'd', name: 'D', x: 15, y: 15 }),
])

function makeStore(doc: Icon = testDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('selectFromPanelAtom', () => {
  describe('plain click', () => {
    it('selects the clicked shape', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
    })

    it('replaces existing selection', () => {
      const store = makeStore()
      seedSelection(store, ['a', 'c'])

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
    })

    it('sets anchor to clicked id', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })

      expect(store.get(selectionAnchorAtom)).toBe('b')
    })

    it('pushes exactly one history entry', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })

      expect(store.get(undoStackAtom)).toHaveLength(1)
    })
  })

  describe('Cmd/Ctrl click (additive)', () => {
    it('toggles a shape into the selection', () => {
      const store = makeStore()
      seedSelection(store, ['a'])

      store.set(selectFromPanelAtom, { id: 'b', additive: true, range: false })

      expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
    })

    it('toggles a shape out of the selection', () => {
      const store = makeStore()
      seedSelection(store, ['a', 'b'])

      store.set(selectFromPanelAtom, { id: 'a', additive: true, range: false })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
    })

    it('sets anchor to clicked id', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'c', additive: true, range: false })

      expect(store.get(selectionAnchorAtom)).toBe('c')
    })

    it('pushes exactly one history entry', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: true, range: false })

      expect(store.get(undoStackAtom)).toHaveLength(1)
    })
  })

  describe('Shift click (range)', () => {
    it('selects range from anchor to clicked id over panel order', () => {
      const store = makeStore()
      // Panel order (reverse z): d, c, b, a
      store.set(selectFromPanelAtom, { id: 'c', additive: false, range: false })
      // anchor = c, selection = [c]
      store.set(undoStackAtom, [])

      store.set(selectFromPanelAtom, { id: 'a', additive: false, range: true })

      // Range [c … a] in panel order (d,c,b,a) → c, b, a
      // Unioned with current selection [c] → c, b, a (normalized to doc z-order: a, b, c)
      expect(store.get(selectedIdsAtom)).toEqual(['a', 'b', 'c'])
    })

    it('unions range with existing selection when shift-clicking', () => {
      const store = makeStore()
      // Panel order: d, c, b, a

      // Cmd-click d to select + set anchor
      store.set(selectFromPanelAtom, { id: 'd', additive: true, range: false })
      // Cmd-click b to add to selection + move anchor to b
      store.set(selectFromPanelAtom, { id: 'b', additive: true, range: false })
      store.set(undoStackAtom, [])
      // Now: selection = [b, d], anchor = b

      // Shift-click a: range [b … a] in panel order → b, a
      // Union with current [b, d] → b, d, a (normalized z-order: a, b, d)
      store.set(selectFromPanelAtom, { id: 'a', additive: false, range: true })

      expect(store.get(selectedIdsAtom)).toEqual(['a', 'b', 'd'])
    })

    it('anchor stays fixed on shift click', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'c', additive: false, range: false })
      const anchorAfterPlain = store.get(selectionAnchorAtom)

      store.set(selectFromPanelAtom, { id: 'a', additive: false, range: true })

      expect(store.get(selectionAnchorAtom)).toBe(anchorAfterPlain)
    })

    it('works when shift target is before anchor in panel order', () => {
      const store = makeStore()
      // Panel order: d, c, b, a
      // Set anchor at b
      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })
      store.set(undoStackAtom, [])

      // Shift-click d (before b in panel order)
      store.set(selectFromPanelAtom, { id: 'd', additive: false, range: true })

      // Range [b…d] in panel order → d, c, b (normalized z-order: b, c, d)
      expect(store.get(selectedIdsAtom)).toEqual(['b', 'c', 'd'])
    })

    it('self-range (shift-click the anchor) keeps just the anchor selected', () => {
      const store = makeStore()
      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })
      store.set(undoStackAtom, [])

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: true })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
    })

    it('pushes exactly one history entry', () => {
      const store = makeStore()
      store.set(selectFromPanelAtom, { id: 'c', additive: false, range: false })
      store.set(undoStackAtom, [])

      store.set(selectFromPanelAtom, { id: 'a', additive: false, range: true })

      expect(store.get(undoStackAtom)).toHaveLength(1)
    })
  })

  describe('empty anchor', () => {
    it('behaves like plain click when anchor is null', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: true })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
      expect(store.get(selectionAnchorAtom)).toBe('b')
    })
  })

  describe('target not in layerIds', () => {
    it('does not corrupt selection when range target is missing from the document', () => {
      const store = makeStore()
      store.set(selectFromPanelAtom, { id: 'a', additive: false, range: false })
      store.set(undoStackAtom, [])

      store.set(selectFromPanelAtom, { id: 'ghost', additive: false, range: true })

      // 'ghost' normalizes out of the document → empty selection, anchor auto-resets
      expect(store.get(selectedIdsAtom)).toEqual([])
      expect(store.get(selectionAnchorAtom)).toBeNull()
    })
  })

  describe('orphaned anchor', () => {
    it('behaves like plain click when anchor shape no longer exists', () => {
      const store = makeStore()

      // Set anchor to c
      store.set(selectFromPanelAtom, { id: 'c', additive: false, range: false })

      // Remove c from document
      store.set(activeIconAtom, (draft) => {
        draft.shapes = draft.shapes.filter((s) => s.id !== 'c')
      })

      // Shift-click b — anchor is orphaned
      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: true })

      expect(store.get(selectedIdsAtom)).toEqual(['b'])
      expect(store.get(selectionAnchorAtom)).toBe('b')
    })
  })

  describe('reset on clear', () => {
    it('clearSelectionCommand resets anchor to null', () => {
      const store = makeStore()

      store.set(selectFromPanelAtom, { id: 'b', additive: false, range: false })
      expect(store.get(selectionAnchorAtom)).toBe('b')

      store.set(clearSelectionCommand, undefined)

      expect(store.get(selectionAnchorAtom)).toBeNull()
    })
  })
})
