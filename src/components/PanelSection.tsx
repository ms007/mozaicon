import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Divider } from './Divider'

interface PanelSectionProps {
  title: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
  /** Prepend a full-bleed hairline divider above the section. Rendered as a
   *  sibling so it spans the panel edge-to-edge, outside the section padding. */
  divided?: boolean
}

export function PanelSection({
  title,
  children,
  className,
  headerAction,
  divided,
}: PanelSectionProps) {
  return (
    <>
      {divided && <Divider />}
      <section className={cn('flex flex-col p-3', className)}>
        <div
          className="mb-1.5 grid items-center gap-1.5"
          style={{ gridTemplateColumns: 'minmax(0, 1fr) 28px' }}
        >
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {title}
          </h2>
          {headerAction && (
            <div className="col-start-2 flex items-center justify-center">{headerAction}</div>
          )}
        </div>
        {children}
      </section>
    </>
  )
}
