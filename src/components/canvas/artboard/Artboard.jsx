import styles from './Artboard.module.css'

export default function Artboard({ width }) {
  return (
    <div className={styles.box} style={{ width, height: width }}>
      Artboard
    </div>
  )
}
