import { useAtomValue } from 'jotai'
import cx from 'clsx'

import { Grid } from './grid'

import { artboardAtom, artboardSizeAtom } from '@/atoms/artboard'
import { presetsIconSize } from '@/atoms/presets'
import { canvasNewItemTypeAtom } from '@/atoms/canvas'

import styles from './Artboard.module.css'

export default function Artboard({ children }) {
  const { margin } = useAtomValue(artboardAtom)
  const iconSize = useAtomValue(presetsIconSize)
  const artboardSize = useAtomValue(artboardSizeAtom)
  const newItemType = useAtomValue(canvasNewItemTypeAtom)

  const style = {
    width: `${artboardSize}px`,
    height: `${artboardSize}px`,
    margin: `${margin}px ${(margin / 100) * 70}px`,
    borderWidth: artboardSize > 600 ? '35px' : '20px',
  }

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
        className={cx(newItemType === 'rectangle' && styles.rectangle)}
      >
        <Grid size={iconSize} />
        {children}
      </svg>
    </div>
  )
}
