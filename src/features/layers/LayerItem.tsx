import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { Eye, EyeOff } from '@/icons'
import { cn } from '@/lib/utils'

export interface LayerItemProps {
  icon: ReactNode
  name: string
  visible: boolean
  selected: boolean
  onSelect: (event: MouseEvent | KeyboardEvent) => void
  onToggleVisible: () => void
  onRename: (next: string) => void
}

export function LayerItem({
  icon,
  name,
  visible,
  selected,
  onSelect,
  onToggleVisible,
  onRename,
}: LayerItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (editing) {
      const el = inputRef.current
      if (el) {
        // Drop any prior document selection (e.g. the span word-select from
        // the dblclick that opened rename mode) so Chrome doesn't animate
        // from it into the input's full-text selection.
        window.getSelection()?.removeAllRanges()
        el.focus({ preventScroll: true })
        el.setSelectionRange(0, el.value.length)
      }
    }
  }, [editing])

  const enterEditMode = useCallback(() => {
    setDraft(name)
    setEditing(true)
  }, [name])

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== name) {
      onRename(trimmed)
    }
  }, [draft, name, onRename])

  const cancel = useCallback(() => {
    setEditing(false)
    setDraft(name)
  }, [name])

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
      tabIndex={0}
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
        'group/layer flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2',
        'transition-colors outline-none',
        selected ? 'ring-ring bg-primary-muted ring-1' : 'hover:bg-sidebar-accent',
      )}
    >
      {/* Icon slot — 16x16 */}
      <span
        className={cn('flex size-4 shrink-0 items-center justify-center', !visible && 'opacity-50')}
      >
        {icon}
      </span>

      {/* Name / rename input */}
      <span
        className={cn(
          'relative flex h-6 min-w-0 flex-1 items-center rounded-sm ring-1 transition-shadow',
          // Ring fade-in is delayed on enter so the text selection paints
          // first; on leave, no delay so the ring vanishes with the input.
          editing ? 'ring-ring delay-[15ms]' : 'ring-transparent',
        )}
      >
        {/* The row already owns role="button" + keyboard handling; this
            span is a passive label whose only mouse affordances exist to
            suppress Chrome's native word-select on dblclick (which would
            leak a document selection into the rename input animation). */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <span
          onMouseDown={(e) => {
            if (e.detail >= 2) e.preventDefault()
          }}
          onDoubleClick={enterEditMode}
          className={cn(
            'block min-w-0 flex-1 truncate px-1.5 pt-0.5 text-sm',
            editing && 'invisible',
            !visible && !editing && 'opacity-50',
          )}
        >
          {name}
        </span>
        {editing && (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                commit()
              } else if (e.key === 'Escape') {
                e.stopPropagation()
                cancel()
              }
            }}
            onBlur={commit}
            className="text-foreground bg-primary-faint absolute inset-0 block w-full rounded-sm px-1.5 pt-0.5 text-sm outline-none"
          />
        )}
      </span>

      {/* Eye toggle — hidden while editing */}
      {!editing && (
        <button
          type="button"
          aria-label="Toggle visibility"
          onClick={handleEyeClick}
          className={cn(
            'text-muted-foreground flex size-4 shrink-0 cursor-pointer items-center justify-center',
            'transition-opacity',
            visible && !selected ? 'opacity-0 group-hover/layer:opacity-100' : 'opacity-100',
          )}
        >
          {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
      )}
    </div>
  )
}
