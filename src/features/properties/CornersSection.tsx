import { useAtomValue, useSetAtom } from 'jotai'
import { type KeyboardEvent, useId, useRef, useState } from 'react'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { Slider } from '@/components/primitives/Slider'
import { Segmented } from '@/components/Segmented'
import {
  CornerBottomLeft,
  CornerBottomRight,
  CornersAll,
  CornerTopLeft,
  CornerTopRight,
} from '@/icons'
import { clamp, parseNumber } from '@/lib/util/number'
import { cn } from '@/lib/utils'
import {
  type SelectionCornerRadii,
  selectionCornerRadiiAtom,
} from '@/store/atoms/selection-corner-radii'
import {
  selectionCornerStyleAtom,
  selectionSmoothingAtom,
} from '@/store/atoms/selection-corner-style'
import { MIXED } from '@/store/atoms/selection-geometry'
import { setCornerStyleCommand } from '@/store/commands/setCornerStyle'
import { setSmoothingCommand } from '@/store/commands/setSmoothing'

import { RadiusField } from './RadiusField'

function uniformValue(radii: SelectionCornerRadii) {
  const { tl, tr, br, bl } = radii
  if (tl === MIXED || tr === MIXED || br === MIXED || bl === MIXED) return MIXED
  if (tl === tr && tr === br && br === bl) return tl
  return MIXED
}

function hasAnyRadius(radii: SelectionCornerRadii): boolean {
  for (const key of ['tl', 'tr', 'br', 'bl'] as const) {
    const v = radii[key]
    if (v === MIXED) return true
    if (v > 0) return true
  }
  return false
}

const STYLE_OPTIONS = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'smooth', label: 'Smooth' },
]

function SmoothingControls() {
  const smoothing = useAtomValue(selectionSmoothingAtom)
  const dispatch = useSetAtom(setSmoothingCommand)

  const isMixed = smoothing === MIXED
  const numericValue = typeof smoothing === 'number' ? smoothing : undefined

  const [buffer, setBuffer] = useState(() => (numericValue != null ? String(numericValue) : ''))
  const [editing, setEditing] = useState(false)
  const [baseNumeric, setBaseNumeric] = useState(numericValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const labelId = `${id}-smoothing-label`

  if (!editing && numericValue !== baseNumeric) {
    setBaseNumeric(numericValue)
    setBuffer(numericValue != null ? String(numericValue) : '')
  }

  function commitBuffer() {
    const parsed = parseNumber(buffer)
    if (parsed == null) {
      setBuffer(numericValue != null ? String(numericValue) : '')
      setBaseNumeric(numericValue)
      return
    }
    const clamped = clamp(parsed, { min: 0, max: 100 })
    setBuffer(String(clamped))
    if (clamped !== baseNumeric) {
      setBaseNumeric(clamped)
      dispatch(clamped)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitBuffer()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setBuffer(numericValue != null ? String(numericValue) : '')
      setBaseNumeric(numericValue)
      inputRef.current?.select()
    }
  }

  function handleFocus() {
    setEditing(true)
    inputRef.current?.select()
  }

  function handleBlur() {
    setEditing(false)
    commitBuffer()
  }

  function handleSliderChange(values: number[]) {
    const value = values[0]
    dispatch(value)
  }

  return (
    <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
      <div className="grid min-w-0 grid-cols-2 items-center gap-1.5">
        <Slider
          aria-label="Smoothing"
          min={0}
          max={100}
          step={1}
          value={isMixed ? [0] : [numericValue ?? 0]}
          onValueChange={handleSliderChange}
          className="min-w-0"
        />
        <label
          data-slot="smoothing-field"
          className={cn(
            INPUT_SURFACE_CLASSES,
            'flex min-w-0 items-center gap-1',
            'transition-colors',
            'focus-within:border-ring',
            'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid',
          )}
        >
          <span id={labelId} className="sr-only">
            Smoothing
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            aria-labelledby={labelId}
            value={buffer}
            placeholder={isMixed ? 'Mixed' : undefined}
            onChange={(e) => {
              setBuffer(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent p-0',
              INPUT_TEXT_CLASSES,
              'outline-none',
              'placeholder:text-muted-foreground placeholder:italic',
            )}
          />
          <span aria-hidden="true" className="text-muted-foreground text-md select-none">
            %
          </span>
        </label>
      </div>
      <div aria-hidden className="w-6" />
    </div>
  )
}

export function CornersSection() {
  const radii = useAtomValue(selectionCornerRadiiAtom)
  const cornerStyle = useAtomValue(selectionCornerStyleAtom)
  const dispatchStyle = useSetAtom(setCornerStyleCommand)
  const [expanded, setExpanded] = useState(false)

  if (!radii.hasRects) return null

  const radiusGated = hasAnyRadius(radii)
  const styleMixed = cornerStyle === MIXED
  const segmentedValue = styleMixed ? '' : (cornerStyle ?? 'rounded')
  const showSmoothing = radiusGated && cornerStyle === 'smooth'

  return (
    <PanelSection title="Corners">
      {expanded ? (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1fr_auto] items-start gap-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <RadiusField
                fieldKey="tl"
                label="Top Left"
                value={radii.tl}
                icon={<CornerTopLeft width={12} height={12} />}
              />
              <RadiusField
                fieldKey="tr"
                label="Top Right"
                value={radii.tr}
                icon={<CornerTopRight width={12} height={12} />}
              />
              <RadiusField
                fieldKey="bl"
                label="Bottom Left"
                value={radii.bl}
                icon={<CornerBottomLeft width={12} height={12} />}
              />
              <RadiusField
                fieldKey="br"
                label="Bottom Right"
                value={radii.br}
                icon={<CornerBottomRight width={12} height={12} />}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              pressed={true}
              onClick={() => {
                setExpanded(false)
              }}
              aria-label="Collapse corner radius"
            >
              <CornersAll />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-center gap-1.5">
          <RadiusField
            fieldKey="uniform"
            label="Corner Radius"
            value={uniformValue(radii)}
            icon={<CornersAll width={12} height={12} />}
            suffix="px"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setExpanded(true)
            }}
            aria-label="Expand corner radius"
          >
            <CornersAll />
          </Button>
        </div>
      )}

      {radiusGated && (
        <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Segmented
              options={STYLE_OPTIONS}
              value={segmentedValue}
              onChange={(value) => {
                dispatchStyle(value as 'rounded' | 'smooth')
              }}
              aria-label="Corner style"
            />
            {styleMixed && <p className="text-muted-foreground text-xs italic">Mixed</p>}
          </div>
          <div aria-hidden className="w-6" />
        </div>
      )}

      {showSmoothing && <SmoothingControls />}
    </PanelSection>
  )
}
