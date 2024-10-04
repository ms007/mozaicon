import styles from './ToolTitle.module.css'

export default function ToolTitle({ children }) {
  return <span className={styles.title}>{children}</span>
}
