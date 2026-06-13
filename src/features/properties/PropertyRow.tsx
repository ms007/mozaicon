import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PropertyRowProps {
  children: ReactNode
  gutter?: ReactNode
  className?: string
}

export function PropertyRow({ children, gutter, className }: PropertyRowProps) {
  return (
    <div
      data-slot="property-row"
      className={cn('grid items-start gap-1.5', className)}
      style={{ gridTemplateColumns: 'minmax(0, 1fr) 28px' }}
    >
      <div className="col-start-1 min-w-0">{children}</div>
      <div className="col-start-2">{gutter}</div>
    </div>
  )
}
