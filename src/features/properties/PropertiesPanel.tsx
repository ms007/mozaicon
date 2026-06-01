import { PanelSection } from '@/components/PanelSection'

import { GeometryField } from './GeometryField'

export function PropertiesPanel() {
  return (
    <aside
      aria-label="Properties"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-60 flex-col gap-3 border-l p-3"
    >
      <PanelSection title="Position">
        <div className="flex gap-2">
          <GeometryField fieldKey="x" label="X" />
          <GeometryField fieldKey="y" label="Y" />
        </div>
      </PanelSection>

      <PanelSection title="Layout">
        <div className="flex gap-2">
          <GeometryField fieldKey="width" label="W" />
          <GeometryField fieldKey="height" label="H" />
        </div>
      </PanelSection>
    </aside>
  )
}
