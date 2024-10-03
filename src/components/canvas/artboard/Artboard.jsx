import { useAtomValue } from 'jotai'

import { artboardAtom, artboardSizeAtom } from '@/atoms/artboard'

import styles from './Artboard.module.css'

export default function Artboard() {
  const { margin } = useAtomValue(artboardAtom)
  const size = useAtomValue(artboardSizeAtom)

  return (
    <div className={styles.box} style={{ width: size, height: size, margin }}>
      Artboard
    </div>
  )
}
