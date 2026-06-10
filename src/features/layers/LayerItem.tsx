import { useSortable } from '@dnd-kit/sortable'
import { useAtomValue, useSetAtom } from 'jotai'
import { type KeyboardEvent, type MouseEvent, useCallback } from 'react'

import { hoveredShapeIdAtom } from '@/store/atoms/hover'
import { layerAtom } from '@/store/atoms/layers'
import { shapeAtom } from '@/store/atoms/project'
import { isShapeSelectedAtom } from '@/store/atoms/selection'
import { renameShapeCommand } from '@/store/commands/renameShape'
import { toggleShapeVisibilityCommand } from '@/store/commands/toggleShapeVisibility'

import { DropIndicator } from './DropIndicator'
import { LayerItemView } from './LayerItemView'
import { LayerThumbnail } from './LayerThumbnail'
import { selectFromPanelAtom } from './panelSelection'

interface LayerItemProps {
  id: string
  dropEdge?: 'top' | 'bottom'
}

export function LayerItem({ id, dropEdge }: LayerItemProps) {
  const layer = useAtomValue(layerAtom(id))
  const shape = useAtomValue(shapeAtom(id))
  const selected = useAtomValue(isShapeSelectedAtom(id))
  const selectFromPanel = useSetAtom(selectFromPanelAtom)
  const toggleVisibility = useSetAtom(toggleShapeVisibilityCommand)
  const rename = useSetAtom(renameShapeCommand)
  const setHovered = useSetAtom(hoveredShapeIdAtom)

  const isLocked = layer?.locked ?? false

  // No sortable transform: the drop position is shown by the custom
  // <DropIndicator /> line, so items stay put. Applying translateY here would
  // push rows past the overflow-y-auto container's content box and surface a
  // spurious scrollbar during drag.
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id,
    disabled: isLocked,
  })

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
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      data-layer-id={id}
      className="relative"
    >
      {dropEdge && <DropIndicator edge={dropEdge} />}
      <LayerItemView
        icon={<LayerThumbnail shape={shape} />}
        name={layer.name}
        visible={layer.visible}
        selected={selected}
        isDragging={isDragging}
        onSelect={handleSelect}
        onToggleVisible={handleToggleVisible}
        onRename={handleRename}
      />
    </div>
  )
}
