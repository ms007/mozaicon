import { atom } from 'jotai'

import { activeIconAtom, shapeAtom } from '@/store/atoms/project'
import { normalizeSelection } from '@/store/atoms/selection'

import { createCommand } from './createCommand'

const _deleteCommand = createCommand<{ ids: string[] }>('Delete shapes', (doc, { ids }) => {
  if (ids.length === 0) return {}

  const toDelete = new Set(ids)
  const next = doc.shapes.filter((s) => !toDelete.has(s.id))

  if (next.length === doc.shapes.length) return {}

  const nextDoc = { ...doc, shapes: next }
  const selection = normalizeSelection([], nextDoc)

  return { icon: nextDoc, selection }
})

export const deleteShapesCommand = atom(null, (get, set, payload: { ids: string[] }) => {
  const iconBefore = get(activeIconAtom)
  set(_deleteCommand, payload)
  const iconAfter = get(activeIconAtom)

  if (iconBefore === iconAfter) return

  for (const id of payload.ids) {
    shapeAtom.remove(id)
  }
})
