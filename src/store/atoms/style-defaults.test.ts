import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { styleDefaultsAtom } from './style-defaults'

describe('styleDefaultsAtom', () => {
  it('has expected initial values', () => {
    const store = createStore()
    expect(store.get(styleDefaultsAtom)).toEqual({
      fill: '#cccccc',
      stroke: 'none',
      strokeWidth: 1,
    })
  })

  it('can be overridden with partial-like values', () => {
    const store = createStore()
    store.set(styleDefaultsAtom, { fill: '#f00', stroke: '#0f0', strokeWidth: 5 })
    expect(store.get(styleDefaultsAtom)).toEqual({
      fill: '#f00',
      stroke: '#0f0',
      strokeWidth: 5,
    })
  })
})
