import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { Icon as SvgIcon } from '@/icons/Icon'
import { cn } from '@/lib/utils'
import { activeIconIdAtom, type IconListItem } from '@/store/atoms/project'
import {
  deleteIconCommand,
  renameIconCommand,
  switchIconCommand,
} from '@/store/commands/iconCommands'

interface IconItemProps {
  icon: IconListItem
  iconCount: number
}

export function IconItem({ icon, iconCount }: IconItemProps) {
  const activeIconId = useAtomValue(activeIconIdAtom)
  const switchIcon = useSetAtom(switchIconCommand)
  const renameIcon = useSetAtom(renameIconCommand)
  const deleteIcon = useSetAtom(deleteIconCommand)
  const isActive = icon.id === activeIconId
  const canDelete = iconCount > 1

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(icon.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (editing) {
      const el = inputRef.current
      if (el) {
        window.getSelection()?.removeAllRanges()
        el.focus({ preventScroll: true })
        el.setSelectionRange(0, el.value.length)
      }
    }
  }, [editing])

  const enterEditMode = useCallback(() => {
    setDraft(icon.name)
    setEditing(true)
  }, [icon.name])

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== icon.name) {
      renameIcon({ iconId: icon.id, name: trimmed })
    }
  }, [draft, icon.name, icon.id, renameIcon])

  const cancel = useCallback(() => {
    setEditing(false)
    setDraft(icon.name)
  }, [icon.name])

  return (
    <div
      role="option"
      tabIndex={0}
      aria-selected={isActive}
      data-slot="icon-item"
      data-editing={editing ? 'true' : 'false'}
      className={cn(
        'group/icon flex h-7 cursor-pointer items-center rounded-md px-2 text-sm transition-colors',
        'focus-visible:ring-ring outline-none focus-visible:ring-1',
        isActive
          ? 'bg-primary-muted text-primary-subtle'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
      onClick={() => {
        if (!editing) {
          switchIcon(icon.id)
        }
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          if (!editing) {
            e.preventDefault()
            switchIcon(icon.id)
          }
        }
      }}
    >
      <span
        className={cn(
          'relative flex h-6 min-w-0 flex-1 items-center rounded-sm ring-1 transition-shadow',
          editing ? 'ring-ring delay-[15ms]' : 'ring-transparent',
        )}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <span
          onMouseDown={(e) => {
            if (e.detail >= 2) e.preventDefault()
          }}
          onDoubleClick={enterEditMode}
          className={cn(
            'block min-w-0 flex-1 truncate px-1.5 pt-0.5 text-sm',
            editing && 'invisible',
          )}
        >
          {icon.name}
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

      {!editing && canDelete && (
        <button
          type="button"
          aria-label="Delete icon"
          onClick={(e) => {
            e.stopPropagation()
            deleteIcon(icon.id)
          }}
          className={cn(
            'text-muted-foreground flex size-4 shrink-0 cursor-pointer items-center justify-center',
            'rounded-sm transition-opacity outline-none',
            'opacity-0 group-hover/icon:opacity-100',
            'focus-visible:ring-ring focus-visible:opacity-100 focus-visible:ring-1',
          )}
        >
          <SvgIcon aria-hidden className="size-3.5">
            <line x1="3" y1="3" x2="11" y2="11" />
            <line x1="11" y1="3" x2="3" y2="11" />
          </SvgIcon>
        </button>
      )}
    </div>
  )
}
