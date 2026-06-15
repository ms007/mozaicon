import type { Atom, PrimitiveAtom, WritableAtom } from 'jotai'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'

import { ColorPicker } from '@/components/ColorPicker'
import { Divider } from '@/components/Divider'
import { Button } from '@/components/primitives/Button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/primitives/Popover'
import { Swatch } from '@/components/Swatch'
import { SwatchInput } from '@/components/SwatchInput'
import type { ColorSlotsState } from '@/store/atoms/colorSlots'
import { MIXED } from '@/store/atoms/selection-geometry'

const FALLBACK_COLOR = '#000000'

export type ColorControlLabels = {
  swatchLabel: string
  hexLabel: string
  pickerTitle: string
}

export type PaintSummary = { color: string | undefined } | null

export type ColorControlProps = {
  paintAtom: Atom<PaintSummary>
  previewAtom: WritableAtom<null, [color: string], void>
  clearPreviewAtom: WritableAtom<null, [], void>
  commitAtom: WritableAtom<null, [color: string], void>
  slotsAtom: PrimitiveAtom<ColorSlotsState>
  labels: ColorControlLabels
  triggerDataSlot?: string
}

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

export function ColorControl({
  paintAtom,
  previewAtom,
  clearPreviewAtom,
  commitAtom,
  slotsAtom,
  labels,
  triggerDataSlot,
}: ColorControlProps) {
  const [slots, setSlots] = useAtom(slotsAtom)
  const paint = useAtomValue(paintAtom)
  const previewColor = useSetAtom(previewAtom)
  const clearPreview = useSetAtom(clearPreviewAtom)
  const commitColor = useSetAtom(commitAtom)

  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [workingColor, setWorkingColor] = useState(FALLBACK_COLOR)

  const selectionColor = paint?.color
  const isMixed = selectionColor === MIXED
  const activeIndex =
    isMixed || selectionColor == null ? -1 : slots.findIndex((s) => s === selectionColor)

  const triggerColor = isMixed || selectionColor == null ? 'transparent' : selectionColor

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
          data-slot={triggerDataSlot}
          color={triggerColor}
          swatchLabel={labels.swatchLabel}
          hexLabel={labels.hexLabel}
          placeholder={isMixed ? 'Mixed' : undefined}
          onSwatchClick={() => {
            if (!open) openPicker()
          }}
          onChange={(hex) => {
            // While the picker is open the popover owns the edit: route trigger
            // typing through the preview path so the in-flight draft and active
            // slot stay in sync and the close handler commits the typed value.
            // Closed, the field is a one-shot quick-commit.
            if (open) {
              handlePickerChange(hex)
            } else {
              commitColor(hex)
            }
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
            {labels.pickerTitle}
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
          {slots.map((color, i) => (
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
