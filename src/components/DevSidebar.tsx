// TRANSIENT: delete once real layers/properties/export panels land.
export function DevSidebar() {
  return (
    <aside
      aria-label="Dev sidebar (transient)"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-72 flex-col gap-3 border-l p-4"
    >
      <p className="text-muted-foreground text-xs tracking-wide uppercase">Dev Sidebar</p>
    </aside>
  )
}
