import { useAtomValue } from 'jotai'

import { artboardAtom, artboardSizeAtom } from '@/atoms/artboard'
import { presetsIconSize } from '@/atoms/presets'
import { Grid } from './grid'

import styles from './Artboard.module.css'

export default function Artboard() {
  const { margin } = useAtomValue(artboardAtom)
  const iconSize = useAtomValue(presetsIconSize)
  const artboardSize = useAtomValue(artboardSizeAtom)

  const style = {
    width: `${artboardSize}px`,
    height: `${artboardSize}px`,
    margin: `${margin}px ${(margin / 100) * 70}px`,
    borderWidth: artboardSize > 600 ? '35px' : '20px',
  }

  return (
    <div className={styles.box} style={style}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        width={artboardSize}
        height={artboardSize}
        overflow="visible"
      >
        <Grid size={iconSize} />
      </svg>
    </div>
  )
}
