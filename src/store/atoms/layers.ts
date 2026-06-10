import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import type { Shape } from '@/types/shapes'

import { activeIconAtom, shapeAtom } from './project'
import { selectionEqual } from './selection'

export interface LayerRecord {
  id: string
  name: string
  visible: boolean
  locked: boolean
  type: Shape['type']
}

export const layerIdsAtom = selectAtom(
  activeIconAtom,
  (doc) => {
    const ids: string[] = []
    for (let i = doc.shapes.length - 1; i >= 0; i--) {
      ids.push(doc.shapes[i].id)
    }
    return ids
  },
  selectionEqual,
)

function toLayerRecord(shape: Shape | undefined): LayerRecord | undefined {
  if (!shape) return undefined
  return {
    id: shape.id,
    name: shape.name,
    visible: shape.visible,
    locked: shape.locked,
    type: shape.type,
  }
}

function layerRecordEqual(a: LayerRecord | undefined, b: LayerRecord | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.visible === b.visible &&
    a.locked === b.locked &&
    a.type === b.type
  )
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

export const layerAtom = atomFamily((id: string) =>
  selectAtom(shapeAtom(id), toLayerRecord, layerRecordEqual),
)
