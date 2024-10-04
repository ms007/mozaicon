import styles from './ToolCaption.module.css'

export default function ToolCaption({ children }) {
  return <span className={styles.caption}>{children}</span>
}
