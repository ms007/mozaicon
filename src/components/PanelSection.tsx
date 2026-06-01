import type { ReactNode } from 'react'

interface PanelSectionProps {
  title: string
  children: ReactNode
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section>
      <h2 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
