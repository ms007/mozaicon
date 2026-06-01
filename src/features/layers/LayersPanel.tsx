import { useAtomValue } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { layerIdsAtom } from '@/store/atoms/layers'

import { LayerItem } from './LayerItem'

export function LayersPanel() {
  const ids = useAtomValue(layerIdsAtom)

  return (
    <aside
      aria-label="Layers"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-60 flex-col border-r p-3"
    >
      <PanelSection title="Layers">
        {ids.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No layers yet</p>
        ) : (
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {ids.map((id) => (
              <LayerItem key={id} id={id} />
            ))}
          </div>
        )}
      </PanelSection>
    </aside>
  )
}
