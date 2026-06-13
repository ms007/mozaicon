import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface EditableLabelProps {
  name: string
  onRename: (next: string) => void
  /** Mirrors the internal edit state so the owning row can drive its own
   *  affordances (data-editing, hiding trailing actions, click guards). */
  onEditingChange?: (editing: boolean) => void
  /** Extra classes for the visible label text (e.g. dimming when hidden). */
  className?: string
}

export function EditableLabel({ name, onRename, onEditingChange, className }: EditableLabelProps) {
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
    onEditingChange?.(true)
  }, [name, onEditingChange])

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    setEditing(false)
    onEditingChange?.(false)
    if (trimmed && trimmed !== name) {
      onRename(trimmed)
    }
  }, [draft, name, onRename, onEditingChange])

  const cancel = useCallback(() => {
    setEditing(false)
    onEditingChange?.(false)
    setDraft(name)
  }, [name, onEditingChange])

  return (
    <span
      className={cn(
        'relative flex h-6 min-w-0 flex-1 items-center rounded-sm ring-1 transition-shadow',
        // Ring fade-in is delayed on enter so the text selection paints first;
        // on leave, no delay so the ring vanishes with the input.
        editing ? 'ring-ring delay-[15ms]' : 'ring-transparent',
      )}
    >
      {/* The owning row handles selection + keyboard; this span is a passive
          label whose only mouse affordances exist to suppress Chrome's native
          word-select on dblclick (which would leak a document selection into
          the rename input animation). */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <span
        onMouseDown={(e) => {
          if (e.detail >= 2) e.preventDefault()
        }}
        onDoubleClick={enterEditMode}
        className={cn(
          'block min-w-0 flex-1 truncate px-1.5 pt-0.5 text-sm',
          editing && 'invisible',
          className,
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
  )
}
