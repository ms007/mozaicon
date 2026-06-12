import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { type ChangeEvent, type InputEvent, useCallback, useRef } from 'react'

import { Swatch } from '@/components/Swatch'
import { COLOR_SLOT_COUNT, strokeColorSlotsAtom } from '@/store/atoms/colorSlots'
import { MIXED } from '@/store/atoms/selection-geometry'
import { selectionStrokeAtom } from '@/store/atoms/selection-stroke'

import { commitStrokeColorAtom } from './commitStrokeColor'
import { clearStrokeColorPreviewAtom, previewStrokeColorAtom } from './previewStrokeColor'

type SlotProps = {
  index: number
  color: string | null
  active: boolean
  onApply: (color: string) => void
  onPickStart: (index: number, color: string) => void
  onPickInput: (color: string) => void
  onPickEnd: (index: number, color: string) => void
}

function Slot({ index, color, active, onApply, onPickStart, onPickInput, onPickEnd }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pickingRef = useRef(false)

  const handleSwatchClick = useCallback(() => {
    if (color === null || active) {
      pickingRef.current = true
      inputRef.current?.click()
    } else {
      onApply(color)
    }
  }, [color, active, onApply])

  const handleInput = useCallback(
    (e: InputEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value
      if (!pickingRef.current) {
        pickingRef.current = true
        onPickStart(index, value)
      }
      onPickInput(value)
    },
    [index, onPickStart, onPickInput],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      pickingRef.current = false
      onPickEnd(index, value)
    },
    [index, onPickEnd],
  )

  const isEmpty = color === null

  return (
    <div className="relative" data-slot="color-slot" data-index={index}>
      <Swatch
        color={isEmpty ? 'transparent' : color}
        active={active}
        onSelect={handleSwatchClick}
        aria-label={
          isEmpty
            ? `Color slot ${String(index + 1)} (empty)`
            : `Color slot ${String(index + 1)}: ${color}`
        }
        className={isEmpty ? 'border-border border-dashed' : undefined}
      />
      <input
        ref={inputRef}
        type="color"
        value={color ?? '#000000'}
        tabIndex={-1}
        aria-hidden="true"
        onInput={handleInput}
        onChange={handleChange}
        className="pointer-events-none absolute inset-0 size-full opacity-0"
      />
    </div>
  )
}

export function ColorSlots() {
  const [slots, setSlots] = useAtom(strokeColorSlotsAtom)
  const stroke = useAtomValue(selectionStrokeAtom)
  const previewColor = useSetAtom(previewStrokeColorAtom)
  const clearPreview = useSetAtom(clearStrokeColorPreviewAtom)
  const commitColor = useSetAtom(commitStrokeColorAtom)

  const selectionColor = stroke?.color
  const isMixed = selectionColor === MIXED

  const handleApply = useCallback(
    (color: string) => {
      commitColor(color)
    },
    [commitColor],
  )

  const handlePickStart = useCallback(
    (index: number, color: string) => {
      setSlots((prev) => {
        const next = [...prev]
        next[index] = color
        return next
      })
      previewColor(color)
    },
    [setSlots, previewColor],
  )

  const handlePickInput = useCallback(
    (color: string) => {
      previewColor(color)
    },
    [previewColor],
  )

  const handlePickEnd = useCallback(
    (index: number, color: string) => {
      setSlots((prev) => {
        const next = [...prev]
        next[index] = color
        return next
      })
      clearPreview()
      commitColor(color)
    },
    [setSlots, clearPreview, commitColor],
  )

  const activeIndex =
    isMixed || selectionColor == null ? -1 : slots.findIndex((s) => s === selectionColor)

  return (
    <div className="flex min-w-0 items-center justify-between" data-slot="color-slots">
      {slots.slice(0, COLOR_SLOT_COUNT).map((color, i) => (
        <Slot
          key={i}
          index={i}
          color={color}
          active={i === activeIndex}
          onApply={handleApply}
          onPickStart={handlePickStart}
          onPickInput={handlePickInput}
          onPickEnd={handlePickEnd}
        />
      ))}
    </div>
  )
}
