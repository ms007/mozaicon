import { atom } from 'jotai'

import { sidebarItemsAtom, sidebarSelectedItemsSortedAtom } from '@/atoms/sidebar'

export const sidebarUpdateSidebarOrderAtom = atom(null, (get, set, { index, id }) => {
  const sidebarItems = get(sidebarItemsAtom)
  const selectedItems = get(sidebarSelectedItemsSortedAtom)

  if (index < 0) {
    return
  }

  const draggingItems = selectedItems.includes(id) ? selectedItems : [id]

  const newItems = [
    ...sidebarItems.slice(0, index).filter((item) => !draggingItems.includes(item)),
    ...draggingItems,
    ...sidebarItems.slice(index).filter((item) => !draggingItems.includes(item)),
  ]

  set(sidebarItemsAtom, newItems)
})
