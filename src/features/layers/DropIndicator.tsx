import { cn } from '@/lib/utils'

interface DropIndicatorProps {
  edge: 'top' | 'bottom'
}

export function DropIndicator({ edge }: DropIndicatorProps) {
  return (
    <div
      data-testid="drop-indicator"
      className={cn(
        'bg-primary pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full',
        edge === 'top' ? '-top-px' : '-bottom-px',
      )}
    />
  )
}
