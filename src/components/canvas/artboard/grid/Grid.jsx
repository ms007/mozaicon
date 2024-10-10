import styles from './Grid.module.css'

export default function Grid({ onClick, size }) {
  const radius = 2 / size

  return (
    <>
      <defs>
        <pattern id="grid" x={0.5} y={0.5} width={1} height={1} patternUnits="userSpaceOnUse">
          <circle className={styles.dots} cx={0.5} cy={0.5} r={radius} />
        </pattern>
      </defs>
      <rect
        x={-0.5}
        y={-0.5}
        width={size + 1}
        height={size + 1}
        fill="url(#grid)"
        onClick={onClick}
      />
    </>
  )
}
