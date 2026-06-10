import { atom } from 'jotai'

import { newId } from '@/lib/ids'
import { projectAtom, shapeAtom } from '@/store/atoms/project'
import type { Icon } from '@/types/shapes'

import { createProjectCommand } from './createCommand'

export const addIconCommand = createProjectCommand('Add icon', (project) => {
  const activeIcon = project.icons.find((i) => i.id === project.activeIconId)
  if (!activeIcon) throw new Error(`activeIconId "${project.activeIconId}" not found`)

  const newIcon: Icon = {
    id: newId(),
    name: `Icon ${String(project.nextIconNumber)}`,
    viewBox: [...activeIcon.viewBox],
    shapes: [],
  }

  return {
    mutate: (draft) => {
      draft.icons.push(newIcon)
      draft.activeIconId = newIcon.id
      draft.nextIconNumber = draft.nextIconNumber + 1
    },
    selectionDoc: newIcon,
  }
})

export const renameIconCommand = createProjectCommand<{ iconId: string; name: string }>(
  'Rename icon',
  (project, { iconId, name }) => {
    const icon = project.icons.find((i) => i.id === iconId)
    if (!icon) return undefined
    if (icon.name === name) return undefined

    return {
      mutate: (draft) => {
        const target = draft.icons.find((i) => i.id === iconId)
        if (target) target.name = name
      },
    }
  },
)

export const switchIconCommand = createProjectCommand<string>(
  'Switch icon',
  (project, targetIconId) => {
    if (project.activeIconId === targetIconId) return undefined

    const targetIcon = project.icons.find((i) => i.id === targetIconId)
    if (!targetIcon) return undefined

    return {
      mutate: (draft) => {
        draft.activeIconId = targetIconId
      },
      selectionDoc: targetIcon,
    }
  },
)

const _deleteIconCommand = createProjectCommand<string>('Delete icon', (project, targetIconId) => {
  if (project.icons.length <= 1) return undefined

  const idx = project.icons.findIndex((i) => i.id === targetIconId)
  if (idx === -1) return undefined

  const wasActive = project.activeIconId === targetIconId
  const successor = wasActive
    ? idx > 0
      ? project.icons[idx - 1]
      : project.icons[idx + 1]
    : undefined

  return {
    mutate: (draft) => {
      draft.icons.splice(idx, 1)
      if (successor) draft.activeIconId = successor.id
    },
    selectionDoc: successor,
  }
})

export const deleteIconCommand = atom(null, (get, set, targetIconId: string) => {
  const beforeProject = get(projectAtom)
  const target = beforeProject.icons.find((i) => i.id === targetIconId)

  set(_deleteIconCommand, targetIconId)

  if (!target || get(projectAtom) === beforeProject) return

  for (const shape of target.shapes) {
    shapeAtom.remove(shape.id)
  }
})
