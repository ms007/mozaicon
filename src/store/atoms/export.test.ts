import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import type { Icon } from '@/types/shapes'

import { allExportDisabledAtom, exportTargetAtom } from './export'
import { activeIconAtom } from './project'

function storeWith(doc: Icon) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

const baseDoc = makeIcon([makeRect({ id: 's1', name: 'R1' })])

describe('exportTargetAtom', () => {
  it('defaults to svg', () => {
    const store = createStore()
    expect(store.get(exportTargetAtom)).toBe('svg')
  })

  it('can be set to any target', () => {
    const store = createStore()
    store.set(exportTargetAtom, 'tsx')
    expect(store.get(exportTargetAtom)).toBe('tsx')
  })
})

describe('allExportDisabledAtom', () => {
  it('returns false when at least one shape is visible', () => {
    const store = storeWith(baseDoc)
    expect(store.get(allExportDisabledAtom)).toBe(false)
  })

  it('returns true when shapes list is empty', () => {
    const store = storeWith(makeIcon())
    expect(store.get(allExportDisabledAtom)).toBe(true)
  })

  it('returns true when all shapes are hidden', () => {
    const store = storeWith(
      makeIcon([
        makeRect({ id: 's1', name: 'R1', visible: false }),
        makeRect({ id: 's2', name: 'R2', visible: false, width: 5, height: 5 }),
      ]),
    )
    expect(store.get(allExportDisabledAtom)).toBe(true)
  })

  it('returns false when some shapes are hidden but at least one is visible', () => {
    const store = storeWith(
      makeIcon([
        makeRect({ id: 's1', name: 'R1', visible: false }),
        makeRect({ id: 's2', name: 'R2', width: 5, height: 5 }),
      ]),
    )
    expect(store.get(allExportDisabledAtom)).toBe(false)
  })
})
