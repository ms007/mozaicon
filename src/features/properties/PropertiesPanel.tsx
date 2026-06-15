import { PanelSection } from '@/components/PanelSection'
import { ExportSection } from '@/features/export/ExportSection'

import { CornersSection } from './CornersSection'
import { FillSection } from './FillSection'
import { GeometryField } from './GeometryField'
import { PropertyRow } from './PropertyRow'
import { StrokeSection } from './StrokeSection'

export function PropertiesPanel() {
  return (
    <aside
      aria-label="Properties"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-60 flex-col border-l"
    >
      <PanelSection title="Position">
        <PropertyRow>
          <div className="flex gap-2">
            <GeometryField fieldKey="x" label="X" />
            <GeometryField fieldKey="y" label="Y" />
          </div>
        </PropertyRow>
      </PanelSection>

      <PanelSection title="Layout" divided>
        <PropertyRow>
          <div className="flex gap-2">
            <GeometryField fieldKey="width" label="W" />
            <GeometryField fieldKey="height" label="H" />
          </div>
        </PropertyRow>
      </PanelSection>

      <CornersSection />
      <FillSection />
      <StrokeSection />

      <div className="mt-auto mb-2">
        <ExportSection />
      </div>
    </aside>
  )
}
