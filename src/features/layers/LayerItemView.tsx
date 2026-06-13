import { type KeyboardEvent, type MouseEvent, type ReactNode, useCallback, useState } from 'react'

import { EditableLabel } from '@/components/EditableLabel'
import { Eye, EyeOff } from '@/icons'
import { cn } from '@/lib/utils'

export interface LayerItemViewProps {
  icon: ReactNode
  name: string
  visible: boolean
  selected: boolean
  isDragging?: boolean
  isOverlay?: boolean
  onSelect: (event: MouseEvent | KeyboardEvent) => void
  onToggleVisible: () => void
  onRename: (next: string) => void
}

export function LayerItemView({
  icon,
  name,
  visible,
  selected,
  isDragging,
  isOverlay,
  onSelect,
  onToggleVisible,
  onRename,
}: LayerItemViewProps) {
  const [editing, setEditing] = useState(false)

  const handleRowClick = useCallback(
    (e: MouseEvent) => {
      if (!editing) {
        onSelect(e)
      }
    },
    [editing, onSelect],
  )

  const handleEyeClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onToggleVisible()
    },
    [onToggleVisible],
  )

  return (
    <div
      role="button"
      tabIndex={isOverlay ? -1 : 0}
      data-slot="layer-item"
      data-selected={selected ? 'true' : 'false'}
      data-visible={visible ? 'true' : 'false'}
      data-editing={editing ? 'true' : 'false'}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (!editing) {
            e.preventDefault()
            onSelect(e)
          }
        }
      }}
      className={cn(
        'group/layer flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2',
        'transition-colors outline-none',
        // Let the rename field run to the row's right edge while editing,
        // keeping a hair of padding so the focus ring isn't clipped.
        editing && 'pr-0.5',
        'focus-visible:ring-ring focus-visible:ring-1',
        selected ? 'bg-primary-muted' : 'hover:bg-sidebar-accent',
        isDragging && 'opacity-40',
        isOverlay && 'bg-sidebar ring-sidebar-border shadow-md ring-1',
      )}
    >
      {/* Icon slot — 16x16 */}
      <span
        className={cn('flex size-4 shrink-0 items-center justify-center', !visible && 'opacity-50')}
      >
        {icon}
      </span>

      {/* Name / rename input */}
      <EditableLabel
        name={name}
        onRename={onRename}
        onEditingChange={setEditing}
        className={cn(!visible && 'opacity-50')}
      />

      {/* Eye toggle — hidden while editing */}
      {!editing && (
        <button
          type="button"
          aria-label="Toggle visibility"
          onClick={handleEyeClick}
          className={cn(
            'text-muted-foreground flex size-4 shrink-0 cursor-pointer items-center justify-center',
            'transition-opacity',
            !visible
              ? 'opacity-50'
              : selected
                ? 'opacity-100'
                : 'opacity-0 group-hover/layer:opacity-100',
          )}
        >
          {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
      )}
    </div>
  )
}
