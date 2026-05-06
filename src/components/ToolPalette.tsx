import type { ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/primitives/ToggleGroup'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/primitives/Tooltip'
import { cn } from '@/lib/utils'

export type ToolOption = {
  value: string
  icon: ReactNode
  label: string
  shortcut?: string
}

export type ToolPaletteProps = {
  options: ToolOption[]
  value: string
  onChange: (value: string) => void
  onItemClick?: (value: string) => void
  'aria-label'?: string
  className?: string
}

export function ToolPalette({
  options,
  value,
  onChange,
  onItemClick,
  'aria-label': ariaLabel,
  className,
}: ToolPaletteProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
      aria-label={ariaLabel}
      className={cn(
        'bg-card border-border flex w-12 flex-col gap-0.5 rounded-lg border p-1.5',
        className,
      )}
    >
      {options.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger asChild>
            {/* Isolate Tooltip's data-state from ToggleGroupItem's so the
                toggle's data-[state=on] selector keeps working. */}
            <div>
              <ToggleGroupItem
                onClick={() => onItemClick?.(option.value)}
                value={option.value}
                aria-label={option.label}
                className={cn(
                  'text-muted-foreground size-9 cursor-pointer rounded-md bg-transparent',
                  'hover:bg-accent hover:text-foreground',
                  'data-[state=on]:bg-primary-muted data-[state=on]:text-primary-subtle',
                  'active:scale-[0.97]',
                  'transition-colors',
                )}
              >
                {option.icon}
              </ToggleGroupItem>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {option.label}
            {option.shortcut ? ` (${option.shortcut})` : null}
          </TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  )
}
