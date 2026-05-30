import { atom } from 'jotai'

import { documentAtom, shapeAtom } from '@/store/atoms/document'
import { normalizeSelection } from '@/store/atoms/selection'

import { createCommand } from './createCommand'

const _deleteCommand = createCommand<{ ids: string[] }>('Delete shapes', (doc, { ids }) => {
  if (ids.length === 0) return {}

  const toDelete = new Set(ids)
  const next = doc.shapes.filter((s) => !toDelete.has(s.id))

  if (next.length === doc.shapes.length) return {}

  const nextDoc = { ...doc, shapes: next }
  const selection = normalizeSelection([], nextDoc)

  return { document: nextDoc, selection }
})

export const deleteShapesCommand = atom(null, (get, set, payload: { ids: string[] }) => {
  const docBefore = get(documentAtom)
  set(_deleteCommand, payload)
  const docAfter = get(documentAtom)

  if (docBefore === docAfter) return

  for (const id of payload.ids) {
    shapeAtom.remove(id)
  }
})
