import { useAtomValue, useSetAtom } from 'jotai'
import cx from 'clsx'

import { Grid } from './grid'

import { artboardAtom, artboardSizeAtom } from '@/atoms/artboard'
import { presetsIconSize } from '@/atoms/presets'
import { canvasIsResizingItemAtom, canvasResetSelectedItems } from '@/atoms/canvas'

import styles from './Artboard.module.css'

export default function Artboard({ cursor, children }) {
  const { margin } = useAtomValue(artboardAtom)
  const iconSize = useAtomValue(presetsIconSize)
  const artboardSize = useAtomValue(artboardSizeAtom)
  const isResizing = useAtomValue(canvasIsResizingItemAtom)
  const resetSelection = useSetAtom(canvasResetSelectedItems)

  const onClick = () => {
    if (!isResizing) {
      resetSelection()
    }
  }

  const style = {
    width: `${artboardSize}px`,
    height: `${artboardSize}px`,
    margin: `${margin}px ${(margin / 100) * 70}px`,
    borderWidth: artboardSize > 600 ? '35px' : '20px',
  }

  const cursorClass = cx(cursor && styles[cursor])

  return (
    <div className={styles.box} style={style}>
      <svg
        id="svg-container"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        width={artboardSize}
        height={artboardSize}
        overflow="visible"
        onClick={onClick}
        className={cursorClass}
      >
        <Grid size={iconSize} />
        {children}
      </svg>
    </div>
  )
}
