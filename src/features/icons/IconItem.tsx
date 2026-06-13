import { useAtomValue, useSetAtom } from 'jotai'
import { useState } from 'react'

import { EditableLabel } from '@/components/EditableLabel'
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
        // Let the rename field run to both row edges while editing, keeping a
        // hair of padding so the focus ring isn't clipped.
        editing && 'px-0.5',
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
      <EditableLabel
        name={icon.name}
        onRename={(name) => {
          renameIcon({ iconId: icon.id, name })
        }}
        onEditingChange={setEditing}
      />

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
