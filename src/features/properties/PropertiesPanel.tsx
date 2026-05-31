import { GeometryField } from './GeometryField'

export function PropertiesPanel() {
  return (
    <aside
      aria-label="Properties"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-60 flex-col gap-3 border-l p-3"
    >
      <section>
        <h2 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
          Position
        </h2>
        <div className="flex gap-2">
          <GeometryField fieldKey="x" label="X" />
          <GeometryField fieldKey="y" label="Y" />
        </div>
      </section>

      <section>
        <h2 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
          Layout
        </h2>
        <div className="flex gap-2">
          <GeometryField fieldKey="width" label="W" />
          <GeometryField fieldKey="height" label="H" />
        </div>
      </section>
    </aside>
  )
}
