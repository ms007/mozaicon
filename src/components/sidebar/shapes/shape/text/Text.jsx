import { useAtomValue } from 'jotai'

import { canvasItemsAtomFamily } from '@/atoms/canvas'

import styles from './Text.module.css'

export default function Text({ id }) {
  const item = useAtomValue(canvasItemsAtomFamily(id))
  const { name } = item

  return <div className={styles.box}>{name}</div>
}
