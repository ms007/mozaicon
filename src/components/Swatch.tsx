// Raw color-swatch button used by any color-selection surface (layer color,
// palette, future pickers). Visual spec: 20×20 square, 1px inside outline for
// separation on light fills, 2px outer border that flips to `--primary` when
// active. Active state is surfaced as `data-active` so tests and consumers can
// key off DOM state rather than Tailwind classes.

import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export type SwatchProps = Omit<
  ComponentProps<'button'>,
  'onSelect' | 'onClick' | 'aria-pressed'
> & {
  color: string
  active?: boolean
  onSelect?: () => void
}

export function Swatch({
  color,
  active = false,
  onSelect,
  className,
  style,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: SwatchProps) {
  return (
    <button
      {...props}
      type={type}
      data-slot="swatch"
      data-active={active ? 'true' : 'false'}
      aria-label={ariaLabel ?? color}
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        'box-border size-5 shrink-0 rounded-[3px] p-0',
        'outline-border/60 border-2 border-transparent outline-1 -outline-offset-1',
        'data-[active=true]:border-primary',
        'cursor-pointer transition-colors',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{ ...style, backgroundColor: color }}
    />
  )
}
