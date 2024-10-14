import { useRef, useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useKey } from 'react-use'

import { canvasItemsAtomFamily, canvasSelectedItemsAtom } from '@/atoms/canvas'
import { sidebarNextItemAtom, sidebarPrevItemAtom, sidebarEditingItemAtom } from '@/atoms/sidebar'

import styles from './Input.module.css'

export default function Input({ id }) {
  const [item, setItem] = useAtom(canvasItemsAtomFamily(id))
  const [editingId, setEditingId] = useAtom(sidebarEditingItemAtom)
  const setSelectedItems = useSetAtom(canvasSelectedItemsAtom)
  const nextCanvasItem = useAtomValue(sidebarNextItemAtom)
  const prevCanvasItem = useAtomValue(sidebarPrevItemAtom)

  const { name } = item
  const lastValue = useRef(name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (id === editingId) {
      inputRef.current.select()
    }

    if (editingId != null && id !== editingId) {
      inputRef.current.focus()
    }
  }, [id, editingId])

  useKey(
    ({ key }) => key === 'Escape' || key === 'Enter',
    (event) => {
      event.preventDefault()
      inputRef.current?.blur()
    },
    { event: 'keydown' }
  )

  useKey(
    ({ key, shiftKey }) => !shiftKey && key === 'Tab',
    (event) => {
      event.preventDefault()
      if (nextCanvasItem) {
        save()
        setSelectedItems([nextCanvasItem])
        inputRef.current.blur()
        setEditingId(nextCanvasItem)
      }
    },
    { event: 'keydown' }
  )

  useKey(
    ({ key, shiftKey }) => shiftKey && key === 'Tab',
    (event) => {
      event.preventDefault()
      if (prevCanvasItem) {
        save()
        setSelectedItems([prevCanvasItem])
        inputRef.current.blur()
        setEditingId(prevCanvasItem)
      }
    },
    { event: 'keydown' }
  )

  const save = () => {
    const value = name.trim().length ? name : lastValue.current
    setItem({ ...item, name: value })
  }

  const onChange = (event) => {
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    lastValue.current = name.length ? name : lastValue
    setItem({ ...item, name: event.target.value })
  }

  const onBlur = () => {
    save()
    setEditingId(null)
  }

  return (
    <div className={styles.box}>
      <input
        draggable
        ref={inputRef}
        value={name}
        onChange={onChange}
        onBlur={onBlur}
        onDragStart={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        className={styles.text}
      />
    </div>
  )
}
