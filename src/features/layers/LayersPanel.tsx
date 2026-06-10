import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useAtomValue, useStore } from 'jotai'
import { useCallback, useMemo, useState } from 'react'

import { PanelSection } from '@/components/PanelSection'
import { layerIdsAtom } from '@/store/atoms/layers'
import { shapeAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { moveShapeBlockCommand } from '@/store/commands/reorderShapes'
import { selectShapesCommand } from '@/store/commands/selectionCommands'

import { DragOverlayContent } from './DragOverlayContent'
import { computeBeforeId, computeDropIndicatorIndex } from './dropPosition'
import { LayerItem } from './LayerItem'
import { useSensors } from './useSensors'

export function LayersPanel() {
  const ids = useAtomValue(layerIdsAtom)
  const selectedIds = useAtomValue(selectedIdsAtom)
  const store = useStore()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors()

  const movingIds = useMemo(() => {
    if (!activeId) return new Set<string>()
    const sel = selectedIds
    if (!sel.includes(activeId)) return new Set([activeId])
    const result = new Set<string>()
    for (const id of sel) {
      const shape = store.get(shapeAtom(id))
      if (shape && !shape.locked) result.add(id)
    }
    return result
  }, [activeId, selectedIds, store])

  const dropIndicatorIndex = useMemo(() => {
    if (!activeId || !overId) return null
    return computeDropIndicatorIndex(ids, activeId, overId)
  }, [activeId, overId, ids])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id)
      setActiveId(id)

      const current = store.get(selectedIdsAtom)
      if (!current.includes(id)) {
        store.set(selectShapesCommand, [id])
      }
    },
    [store],
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setOverId(null)

      if (!over || active.id === over.id) return

      const activeStr = String(active.id)
      const overStr = String(over.id)

      if (!ids.includes(activeStr) || !ids.includes(overStr)) return

      const beforeId = computeBeforeId(ids, activeStr, overStr)
      const sel = store.get(selectedIdsAtom)
      const idsToMove = sel.includes(activeStr) ? sel : [activeStr]

      store.set(moveShapeBlockCommand, { ids: idsToMove, beforeId })
    },
    [ids, store],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverId(null)
  }, [])

  return (
    <PanelSection title="Layers" className="min-h-0 flex-1">
      {ids.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">No layers yet</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div
              className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
              role="listbox"
              aria-label="Layer list"
            >
              {ids.map((id, index) => {
                const dropEdge =
                  dropIndicatorIndex === index
                    ? 'top'
                    : dropIndicatorIndex === ids.length && index === ids.length - 1
                      ? 'bottom'
                      : undefined
                return <LayerItem key={id} id={id} dropEdge={dropEdge} />
              })}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeId ? <DragOverlayContent activeId={activeId} count={movingIds.size} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </PanelSection>
  )
}
