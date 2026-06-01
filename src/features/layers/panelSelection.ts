import { atom } from 'jotai'

import { union } from '@/lib/selection'
import { layerIdsAtom } from '@/store/atoms/layers'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { selectShapesCommand, toggleSelectionCommand } from '@/store/commands/selectionCommands'

const _anchorAtom = atom<string | null>(null)

export const selectionAnchorAtom = atom(
  (get) => {
    const ids = get(selectedIdsAtom)
    if (ids.length === 0) return null
    return get(_anchorAtom)
  },
  (_get, set, value: string | null) => {
    set(_anchorAtom, value)
  },
)

interface PanelSelectPayload {
  id: string
  additive: boolean
  range: boolean
}

export const selectFromPanelAtom = atom(null, (get, set, payload: PanelSelectPayload) => {
  const { id, additive, range } = payload

  if (range) {
    const anchor = get(selectionAnchorAtom)
    const layerIds = get(layerIdsAtom)
    const anchorIdx = anchor === null ? -1 : layerIds.indexOf(anchor)
    const targetIdx = layerIds.indexOf(id)

    if (anchorIdx === -1 || targetIdx === -1) {
      set(selectShapesCommand, [id])
      set(selectionAnchorAtom, id)
      return
    }

    const lo = Math.min(anchorIdx, targetIdx)
    const hi = Math.max(anchorIdx, targetIdx)
    const rangeIds = layerIds.slice(lo, hi + 1)

    const current = get(selectedIdsAtom)
    const merged = union(current, rangeIds)
    set(selectShapesCommand, merged)
    return
  }

  if (additive) {
    set(toggleSelectionCommand, id)
    set(selectionAnchorAtom, id)
    return
  }

  set(selectShapesCommand, [id])
  set(selectionAnchorAtom, id)
})
