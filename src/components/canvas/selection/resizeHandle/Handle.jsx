import styles from './Handle.module.css'

const getCursor = (direction) => {
  switch (direction) {
    case 'e':
    case 'w':
      return 'ew-resize'
    case 'n':
    case 's':
      return 'ns-resize'
    case 'ne':
    case 'sw':
      return 'nesw-resize'
    case 'nw':
    case 'se':
      return 'nwse-resize'
    default:
      return 'pointer'
  }
}

export function Handle({ size, direction, strokeWidth, ...props }) {
  const cursor = getCursor(direction)

  return (
    <circle
      r={size}
      strokeWidth={strokeWidth}
      className={styles.handle}
      style={{ cursor }}
      {...props}
    ></circle>
  )
}
