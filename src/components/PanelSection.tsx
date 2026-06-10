import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PanelSectionProps {
  title: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}

export function PanelSection({ title, children, className, headerAction }: PanelSectionProps) {
  return (
    <section className={cn('flex flex-col', className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
        {headerAction}
      </div>
      {children}
    </section>
  )
}
