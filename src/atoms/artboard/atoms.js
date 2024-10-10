import { atom } from 'jotai'

import { sidebarWidthAtom } from '../sidebar'
import { inspectorWidthAtom } from '../inspector'
import { presetsDimensionsAtom, presetsIconSize } from '../presets'

export const artboardAtom = atom({ margin: 80, minWidth: 300, maxWidth: 900 })

export const artboardSizeAtom = atom((get) => {
  const { margin, minWidth, maxWidth } = get(artboardAtom)

  const dimensions = get(presetsDimensionsAtom)
  const sidebarWidth = get(sidebarWidthAtom)
  const inspectorWidth = get(inspectorWidthAtom)

  const desiredWidth = dimensions.width - sidebarWidth - inspectorWidth - margin * 2
  const desiredHeight = dimensions.height - margin * 2
  let artboardWidth = desiredWidth < desiredHeight ? desiredWidth : desiredHeight
  artboardWidth = artboardWidth >= minWidth ? artboardWidth : minWidth
  artboardWidth = artboardWidth <= maxWidth ? artboardWidth : maxWidth
  return artboardWidth
})

export const artboardPixelSize = atom((get) => {
  const artboardSize = get(artboardSizeAtom)
  const iconSize = get(presetsIconSize)

  return iconSize / artboardSize
})
