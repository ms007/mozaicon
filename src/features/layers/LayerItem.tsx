import { useAtomValue, useSetAtom } from 'jotai'
import { type KeyboardEvent, type MouseEvent, useCallback } from 'react'

import { shapeAtom } from '@/store/atoms/document'
import { hoveredShapeIdAtom } from '@/store/atoms/hover'
import { layerAtom } from '@/store/atoms/layers'
import { isShapeSelectedAtom } from '@/store/atoms/selection'
import { renameShapeCommand } from '@/store/commands/renameShape'
import { toggleShapeVisibilityCommand } from '@/store/commands/toggleShapeVisibility'

import { LayerItemView } from './LayerItemView'
import { LayerThumbnail } from './LayerThumbnail'
import { selectFromPanelAtom } from './panelSelection'

interface LayerItemProps {
  id: string
}

export function LayerItem({ id }: LayerItemProps) {
  const layer = useAtomValue(layerAtom(id))
  const shape = useAtomValue(shapeAtom(id))
  const selected = useAtomValue(isShapeSelectedAtom(id))
  const selectFromPanel = useSetAtom(selectFromPanelAtom)
  const toggleVisibility = useSetAtom(toggleShapeVisibilityCommand)
  const rename = useSetAtom(renameShapeCommand)
  const setHovered = useSetAtom(hoveredShapeIdAtom)

  const handleSelect = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      selectFromPanel({
        id,
        additive: e.metaKey || e.ctrlKey,
        range: e.shiftKey,
      })
    },
    [id, selectFromPanel],
  )

  const handleToggleVisible = useCallback(() => {
    toggleVisibility({ id })
  }, [toggleVisibility, id])

  const handleRename = useCallback(
    (name: string) => {
      rename({ id, name })
    },
    [id, rename],
  )

  const handlePointerEnter = useCallback(() => {
    setHovered(id)
  }, [id, setHovered])

  const handlePointerLeave = useCallback(() => {
    setHovered((prev) => (prev === id ? null : prev))
  }, [id, setHovered])

  if (!layer || !shape) return null

  return (
    <div onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <LayerItemView
        icon={<LayerThumbnail shape={shape} />}
        name={layer.name}
        visible={layer.visible}
        selected={selected}
        onSelect={handleSelect}
        onToggleVisible={handleToggleVisible}
        onRename={handleRename}
      />
    </div>
  )
}
