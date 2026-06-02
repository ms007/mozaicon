import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PanelSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function PanelSection({ title, children, className }: PanelSectionProps) {
  return (
    <section className={cn('flex flex-col', className)}>
      <h2 className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
