import { useAtomValue } from 'jotai'

import { artboardPixelSize } from '@/atoms/artboard'

import styles from './Border.module.css'

export default function Border({ coordinates }) {
  const onePixel = useAtomValue(artboardPixelSize)

  const offset = 0

  const offsetX = coordinates.topLeft.x - offset
  const offsetY = coordinates.topLeft.y - offset
  const offsetWidth = coordinates.width + offset * 2
  const offsetHeight = coordinates.height + offset * 2

  const topLeft = { x: offsetX, y: offsetY }
  const topRight = { x: offsetX + offsetWidth, y: offsetY }
  const bottomRight = { x: offsetX + offsetWidth, y: offsetY + offsetHeight }
  const bottomLeft = { x: offsetX, y: offsetY + offsetHeight }

  const d =
    `M${topLeft.x},${topLeft.y} L${topRight.x},${topRight.y}` +
    ` ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}z`

  return <path strokeWidth={onePixel * 2} d={d} className={styles.path}></path>
}
