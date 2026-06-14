import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'

import { ColorPicker } from '@/components/ColorPicker'
import { Divider } from '@/components/Divider'
import { Button } from '@/components/primitives/Button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/primitives/Popover'
import { Swatch } from '@/components/Swatch'
import { SwatchInput } from '@/components/SwatchInput'
import { COLOR_SLOT_COUNT, strokeColorSlotsAtom } from '@/store/atoms/colorSlots'
import { MIXED } from '@/store/atoms/selection-geometry'
import { selectionStrokeAtom } from '@/store/atoms/selection-stroke'

import { commitStrokeColorAtom } from './commitStrokeColor'
import { clearStrokeColorPreviewAtom, previewStrokeColorAtom } from './previewStrokeColor'

const FALLBACK_COLOR = '#000000'

type SlotProps = {
  index: number
  color: string | null
  active: boolean
  onClick: () => void
}

function Slot({ index, color, active, onClick }: SlotProps) {
  const isEmpty = color === null
  return (
    <div data-slot="color-slot" data-index={index}>
      <Swatch
        color={isEmpty ? 'transparent' : color}
        active={active}
        onSelect={onClick}
        aria-label={
          isEmpty
            ? `Color slot ${String(index + 1)} (empty)`
            : `Color slot ${String(index + 1)}: ${color}`
        }
        className={isEmpty ? 'border-border border-dashed' : undefined}
      />
    </div>
  )
}

export function StrokeColorControl() {
  const [slots, setSlots] = useAtom(strokeColorSlotsAtom)
  const stroke = useAtomValue(selectionStrokeAtom)
  const previewColor = useSetAtom(previewStrokeColorAtom)
  const clearPreview = useSetAtom(clearStrokeColorPreviewAtom)
  const commitColor = useSetAtom(commitStrokeColorAtom)

  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [workingColor, setWorkingColor] = useState(FALLBACK_COLOR)

  const selectionColor = stroke?.color
  const isMixed = selectionColor === MIXED
  const activeIndex =
    isMixed || selectionColor == null ? -1 : slots.findIndex((s) => s === selectionColor)

  const triggerColor = isMixed || selectionColor == null ? 'transparent' : selectionColor

  // If we unmount while open (selection cleared, shape deleted, panel collapsed),
  // no close handler runs — drop the preview draft so it can't strand a ghost
  // stroke override or leave a gesture draft active.
  useEffect(
    () => () => {
      clearPreview()
    },
    [clearPreview],
  )

  const openPicker = useCallback(() => {
    const seed = isMixed || selectionColor == null ? FALLBACK_COLOR : selectionColor
    setWorkingColor(seed)
    setEditingIndex(activeIndex >= 0 ? activeIndex : null)
    setOpen(true)
    previewColor(seed)
  }, [isMixed, selectionColor, activeIndex, previewColor])

  const commitAndClose = useCallback(() => {
    clearPreview()
    commitColor(workingColor)
    setOpen(false)
  }, [clearPreview, commitColor, workingColor])

  const revertAndClose = useCallback(() => {
    clearPreview()
    setOpen(false)
  }, [clearPreview])

  const handlePickerChange = useCallback(
    (hex: string) => {
      setWorkingColor(hex)
      if (editingIndex !== null) {
        setSlots((prev) => {
          const next = [...prev]
          next[editingIndex] = hex
          return next
        })
      }
      previewColor(hex)
    },
    [editingIndex, setSlots, previewColor],
  )

  const handleSlotClick = useCallback(
    (index: number) => {
      const slotColor = slots[index]
      if (slotColor === null) {
        setSlots((prev) => {
          const next = [...prev]
          next[index] = workingColor
          return next
        })
        setEditingIndex(index)
        return
      }
      setEditingIndex(index)
      setWorkingColor(slotColor)
      previewColor(slotColor)
    },
    [slots, workingColor, setSlots, previewColor],
  )

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <SwatchInput
          data-slot="stroke-color-trigger"
          color={triggerColor}
          swatchLabel="Stroke color"
          hexLabel="Stroke color hex"
          placeholder={isMixed ? 'Mixed' : undefined}
          onSwatchClick={() => {
            if (!open) openPicker()
          }}
          onChange={(hex) => {
            commitColor(hex)
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={8}
        className="w-72 p-3"
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          revertAndClose()
        }}
        onInteractOutside={() => {
          commitAndClose()
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Stroke color
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close color picker"
            onClick={commitAndClose}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>

        <ColorPicker color={workingColor} onChange={handlePickerChange} onEscape={revertAndClose} />

        <div className="-mx-3 mt-3">
          <Divider />
        </div>
        <div className="mt-3 flex min-w-0 items-center justify-between" data-slot="color-slots">
          {slots.slice(0, COLOR_SLOT_COUNT).map((color, i) => (
            <Slot
              key={i}
              index={i}
              color={color}
              active={i === editingIndex}
              onClick={() => {
                handleSlotClick(i)
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
