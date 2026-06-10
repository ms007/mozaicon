import { useAtomValue } from 'jotai'

import { layerAtom } from '@/store/atoms/layers'
import { shapeAtom } from '@/store/atoms/project'

import { LayerItemView } from './LayerItemView'
import { LayerThumbnail } from './LayerThumbnail'

interface DragOverlayContentProps {
  activeId: string
  count: number
}

function noop() {
  return undefined
}

export function DragOverlayContent({ activeId, count }: DragOverlayContentProps) {
  const layer = useAtomValue(layerAtom(activeId))
  const shape = useAtomValue(shapeAtom(activeId))

  if (!layer || !shape) return null

  return (
    <div className="relative w-54">
      {count > 2 && (
        <div className="bg-sidebar border-sidebar-border absolute inset-x-0 top-0 h-8 translate-x-1 translate-y-1 rounded-md border opacity-40" />
      )}
      {count > 1 && (
        <div className="bg-sidebar border-sidebar-border absolute inset-x-0 top-0 h-8 translate-x-0.5 translate-y-0.5 rounded-md border opacity-60" />
      )}
      <LayerItemView
        icon={<LayerThumbnail shape={shape} />}
        name={layer.name}
        visible={layer.visible}
        selected
        isOverlay
        onSelect={noop}
        onToggleVisible={noop}
        onRename={noop}
      />
      {count > 1 && (
        <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-xs font-medium">
          {count}
        </div>
      )}
    </div>
  )
}
