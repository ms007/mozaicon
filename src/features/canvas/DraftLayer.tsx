import { useAtomValue } from 'jotai'

import { draftShapeAtom } from '@/store/atoms/draft'

import { ShapeRenderer } from './renderers/ShapeRenderer'

export function DraftLayer() {
  const draft = useAtomValue(draftShapeAtom)
  if (!draft) return null
  return <ShapeRenderer shape={draft} />
}
