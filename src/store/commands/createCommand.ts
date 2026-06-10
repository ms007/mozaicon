import { atom } from 'jotai'

import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom, projectAtom } from '@/store/atoms/project'
import { commitSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import type { Icon, Project } from '@/types/shapes'

export type CommandResult = {
  icon?: Icon
  selection?: string[]
}

export function createCommand<Payload>(
  label: string,
  apply: (icon: Icon, payload: Payload, selection: string[]) => CommandResult,
) {
  return atom(null, (get, set, payload: Payload) => {
    if (get(isGestureActiveAtom)) return

    const beforeProject = get(projectAtom)
    const beforeIcon = get(activeIconAtom)
    const selectionBefore = get(selectedIdsAtom)
    const result = apply(beforeIcon, payload, selectionBefore)

    const afterIcon = result.icon ?? beforeIcon
    const { changed: selChanged, ids: selectionAfter } = result.selection
      ? set(commitSelectionAtom, { ids: result.selection, doc: afterIcon })
      : { changed: false, ids: selectionBefore }

    const iconChanged = afterIcon !== beforeIcon
    if (!iconChanged && !selChanged) return

    if (iconChanged) set(activeIconAtom, afterIcon)

    const afterProject = get(projectAtom)
    set(undoStackAtom, (s) => [
      ...s,
      { label, before: beforeProject, after: afterProject, selectionBefore, selectionAfter },
    ])
    set(redoStackAtom, [])
  })
}

export type ProjectCommandResult = {
  mutate: (draft: Project) => void
  selectionDoc?: Icon
}

export function createProjectCommand<Payload = undefined>(
  label: string,
  apply: (project: Project, payload: Payload) => ProjectCommandResult | undefined,
) {
  return atom(null, (get, set, ...args: undefined extends Payload ? [] : [Payload]) => {
    if (get(isGestureActiveAtom)) return

    const beforeProject = get(projectAtom)
    const selectionBefore = get(selectedIdsAtom)
    const [payload] = args as [Payload]
    const result = apply(beforeProject, payload)
    if (!result) return

    set(projectAtom, result.mutate)

    const { ids: selectionAfter } = result.selectionDoc
      ? set(commitSelectionAtom, { ids: [], doc: result.selectionDoc })
      : { ids: selectionBefore }

    const afterProject = get(projectAtom)
    set(undoStackAtom, (s) => [
      ...s,
      { label, before: beforeProject, after: afterProject, selectionBefore, selectionAfter },
    ])
    set(redoStackAtom, [])
  })
}
