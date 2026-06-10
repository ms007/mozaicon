import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'
import { atomWithImmer } from 'jotai-immer'

import { DEFAULT_VIEWBOX, type Icon, type Project, type Shape } from '@/types/shapes'

export const projectAtom = atomWithImmer<Project>({
  id: 'proj-1',
  icons: [
    {
      id: 'icon-1',
      name: 'Icon 1',
      viewBox: [...DEFAULT_VIEWBOX] as Icon['viewBox'],
      shapes: [],
    },
  ],
  activeIconId: 'icon-1',
  nextIconNumber: 2,
})

type IconUpdater = Icon | ((draft: Icon) => void)

export const activeIconAtom = atom(
  (get): Icon => {
    const project = get(projectAtom)
    const icon = project.icons.find((i) => i.id === project.activeIconId)
    if (!icon) throw new Error(`activeIconId "${project.activeIconId}" not found in project`)
    return icon
  },
  (_get, set, update: IconUpdater) => {
    set(projectAtom, (draft) => {
      const idx = draft.icons.findIndex((i) => i.id === draft.activeIconId)
      if (idx === -1) throw new Error(`activeIconId "${draft.activeIconId}" not found in project`)
      if (typeof update === 'function') {
        update(draft.icons[idx])
      } else {
        draft.icons[idx] = update
        draft.activeIconId = update.id
      }
    })
  },
)

export const shapesAtom = atom(
  (get) => get(activeIconAtom).shapes,
  (_get, set, shapes: Shape[]) => {
    set(activeIconAtom, (draft) => {
      draft.shapes = shapes
    })
  },
)

export const shapeAtomsAtom = splitAtom(shapesAtom)

export type IconListItem = { id: string; name: string }

export const iconListAtom = atom((get): IconListItem[] => {
  const project = get(projectAtom)
  return project.icons.map((i) => ({ id: i.id, name: i.name }))
})

export const activeIconIdAtom = atom((get) => get(projectAtom).activeIconId)

// Immer keeps unchanged shapes referentially stable, so .find() returns the
// same reference when other shapes mutate — Jotai's Object.is check then
// suppresses notification to subscribers of unaffected ids.
export const shapeAtom = atomFamily((id: string) =>
  atom((get) => get(shapesAtom).find((s) => s.id === id)),
)
