import { useSetAtom } from 'jotai'
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react'

import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { clamp, parseNumber, step } from '@/lib/util/number'
import { cn } from '@/lib/utils'
import { type FieldValue, MIXED } from '@/store/atoms/selection-geometry'

import { commitCornerRadiusFieldAtom, type CornerRadiusFieldKey } from './commitCornerRadiusField'
import {
  clearCornerRadiusPreviewAtom,
  previewCornerRadiusFieldAtom,
} from './previewCornerRadiusField'

type RadiusFieldProps = {
  fieldKey: CornerRadiusFieldKey
  label: string
  value: FieldValue
  icon: ReactNode
  suffix?: ReactNode
}

function numericOf(value: FieldValue): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function displayOf(value: number | undefined): string {
  return value != null ? String(value) : ''
}

export function RadiusField({ fieldKey, label, value, icon, suffix }: RadiusFieldProps) {
  const commitField = useSetAtom(commitCornerRadiusFieldAtom)
  const previewField = useSetAtom(previewCornerRadiusFieldAtom)
  const clearPreview = useSetAtom(clearCornerRadiusPreviewAtom)

  const isMixed = value === MIXED
  const numericValue = numericOf(value)

  const [buffer, setBuffer] = useState(() => displayOf(numericValue))
  const [editing, setEditing] = useState(false)
  const [baseNumeric, setBaseNumeric] = useState(numericValue)
  // the command clamps harder than the field (per-shape max of min(w,h)/2),
  // so after a commit the field must re-sync even while still focused
  const [syncAfterCommit, setSyncAfterCommit] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const labelId = `${id}-label`

  if (syncAfterCommit) setSyncAfterCommit(false)
  if ((!editing || syncAfterCommit) && numericValue !== baseNumeric) {
    setBaseNumeric(numericValue)
    setBuffer(displayOf(numericValue))
  }

  function commitBuffer() {
    clearPreview()
    const parsed = parseNumber(buffer)
    if (parsed == null) {
      setBuffer(displayOf(numericValue))
      setBaseNumeric(numericValue)
      return
    }
    const clamped = clamp(parsed, { min: 0 })
    setBuffer(String(clamped))
    if (clamped !== baseNumeric) {
      setBaseNumeric(clamped)
      commitField({ field: fieldKey, value: clamped })
      setSyncAfterCommit(true)
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
        { min: 0 },
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
      data-slot="radius-field"
      className={cn(
        INPUT_SURFACE_CLASSES,
        'flex min-w-0 flex-1 items-center gap-1',
        'transition-colors',
        'focus-within:border-ring',
        'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid',
      )}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <span aria-hidden="true" className="text-muted-foreground flex shrink-0 items-center">
        {icon}
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
      {suffix && (
        <span aria-hidden="true" className="text-muted-foreground text-md select-none">
          {suffix}
        </span>
      )}
    </label>
  )
}
