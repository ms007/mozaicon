import { useAtomValue, useSetAtom } from 'jotai'
import { type KeyboardEvent, useId, useRef, useState } from 'react'

import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { clamp, parseNumber, step } from '@/lib/util/number'
import { cn } from '@/lib/utils'
import { MIXED, selectionGeometryAtom } from '@/store/atoms/selection-geometry'

import { commitGeometryFieldAtom, type GeometryKey } from './commitGeometryField'
import { clearGeometryPreviewAtom, previewGeometryFieldAtom } from './previewGeometryField'

type GeometryFieldProps = {
  fieldKey: GeometryKey
  label: string
}

function numericOf(value: number | typeof MIXED | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function displayOf(value: number | undefined): string {
  return value != null ? String(value) : ''
}

export function GeometryField({ fieldKey, label }: GeometryFieldProps) {
  const geometry = useAtomValue(selectionGeometryAtom)
  const commitField = useSetAtom(commitGeometryFieldAtom)
  const previewField = useSetAtom(previewGeometryFieldAtom)
  const clearPreview = useSetAtom(clearGeometryPreviewAtom)

  const disabled = geometry == null
  const fieldValue = geometry?.[fieldKey]
  const isMixed = fieldValue === MIXED
  const numericValue = numericOf(fieldValue)

  const [buffer, setBuffer] = useState(() => displayOf(numericValue))
  const [editing, setEditing] = useState(false)
  const [baseNumeric, setBaseNumeric] = useState(numericValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const labelId = `${id}-label`

  if (!editing && numericValue !== baseNumeric) {
    setBaseNumeric(numericValue)
    setBuffer(displayOf(numericValue))
  }

  const minValue = fieldKey === 'width' || fieldKey === 'height' ? 0 : undefined

  function commitBuffer() {
    clearPreview()
    const parsed = parseNumber(buffer)
    if (parsed == null) {
      setBuffer(displayOf(numericValue))
      setBaseNumeric(numericValue)
      return
    }
    const clamped = clamp(parsed, { min: minValue })
    setBuffer(String(clamped))
    if (clamped !== baseNumeric) {
      setBaseNumeric(clamped)
      commitField({ field: fieldKey, value: clamped })
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
      clearPreview()
      setBuffer(displayOf(numericValue))
      setBaseNumeric(numericValue)
      inputRef.current?.select()
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const currentValue = parseNumber(buffer) ?? numericValue
      if (currentValue == null) return
      const stepped = clamp(
        step(currentValue, {
          baseStep: 1,
          direction: e.key === 'ArrowUp' ? 1 : -1,
          coarse: e.shiftKey,
          fine: e.altKey,
        }),
        { min: minValue },
      )
      setBuffer(String(stepped))
      previewField({ field: fieldKey, value: stepped })
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

  return (
    <label
      data-slot="geometry-field"
      className={cn(
        INPUT_SURFACE_CLASSES,
        'flex min-w-0 flex-1 items-center gap-1',
        'transition-colors',
        'focus-within:border-ring',
        'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <span aria-hidden="true" className="text-muted-foreground text-md select-none">
        {label}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        aria-labelledby={labelId}
        value={buffer}
        placeholder={isMixed ? 'Mixed' : undefined}
        disabled={disabled}
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
          'disabled:cursor-not-allowed',
        )}
      />
    </label>
  )
}
