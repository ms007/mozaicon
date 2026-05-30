import { type KeyboardEvent, type ReactNode, type RefObject, useId, useRef, useState } from 'react'

import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { clamp, parseNumber, step as stepValue } from '@/lib/util/number'
import { cn } from '@/lib/utils'

export type NumberInputProps = {
  value: number
  onCommit: (value: number) => void
  onChange?: (value: number) => void
  label: string
  prefix?: ReactNode
  suffix?: ReactNode
  step?: number
  fineStep?: number
  min?: number
  max?: number
  precision?: number
  className?: string
  disabled?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
}

const DEFAULT_FINE_STEP = 0.1

function formatDisplay(value: number, precision?: number): string {
  if (precision != null) return value.toFixed(precision)
  const s = String(value)
  // String() switches to scientific notation for |value| < 1e-6, which
  // parseNumber rejects — expand small magnitudes back to plain decimals so the
  // display always round-trips through commit instead of locking the field.
  if (s.includes('e') && Math.abs(value) < 1) {
    return value.toFixed(20).replace(/\.?0+$/, '')
  }
  return s
}

export function NumberInput({
  value,
  onCommit,
  onChange,
  label,
  prefix,
  suffix,
  step = 1,
  fineStep,
  min,
  max,
  precision,
  className,
  disabled = false,
  inputRef: externalRef,
}: NumberInputProps) {
  const [buffer, setBuffer] = useState(() => formatDisplay(value, precision))
  const [editing, setEditing] = useState(false)
  const [baseValue, setBaseValue] = useState(value)
  const [basePrecision, setBasePrecision] = useState(precision)
  const internalRef = useRef<HTMLInputElement>(null)
  const inputElRef = externalRef ?? internalRef
  const id = useId()
  const labelId = `${id}-label`

  // Re-seed the buffer from props only while the user isn't editing, so an
  // external value change can't clobber an in-progress edit.
  if ((value !== baseValue || precision !== basePrecision) && !editing) {
    setBaseValue(value)
    setBasePrecision(precision)
    setBuffer(formatDisplay(value, precision))
  }

  // A finer step only makes sense if the field shows fractions: default it to
  // the smallest increment the display precision can represent (so an integer
  // field's Alt step is the base step, not a fractional no-op), else 0.1.
  const effectiveFineStep = fineStep ?? (precision != null ? 10 ** -precision : DEFAULT_FINE_STEP)

  function anchorTo(next: number) {
    setBaseValue(next)
    setBasePrecision(precision)
  }

  function commitBuffer() {
    const parsed = parseNumber(buffer)
    if (parsed == null) {
      setBuffer(formatDisplay(value, precision))
      return
    }
    const clamped = clamp(parsed, { min, max })
    setBuffer(formatDisplay(clamped, precision))
    // Compare against the value the buffer was anchored to, not the live prop —
    // an external value change while editing must not be re-committed as the
    // user's own edit. Re-anchor so a repeat Enter is a no-op.
    if (clamped !== baseValue) {
      anchorTo(clamped)
      onCommit(clamped)
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
      setBuffer(formatDisplay(value, precision))
      anchorTo(value)
      // Restore any live preview the typed/stepped onChange values moved.
      onChange?.(value)
      inputElRef.current?.select()
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const direction: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1
      const current = parseNumber(buffer) ?? value
      const stepped = stepValue(current, {
        baseStep: step,
        direction,
        coarse: e.shiftKey,
        fine: e.altKey,
        fineStep: effectiveFineStep,
      })
      const clamped = clamp(stepped, { min, max })
      setBuffer(formatDisplay(clamped, precision))
      onChange?.(clamped)
    }
  }

  function handleBlur() {
    setEditing(false)
    commitBuffer()
  }

  function handleFocus() {
    setEditing(true)
    inputElRef.current?.select()
  }

  return (
    <label
      data-slot="number-input"
      className={cn(
        INPUT_SURFACE_CLASSES,
        'flex items-center gap-1',
        'transition-colors',
        // Focus recipe mirrors primitives/Input's DS spec, surfaced from the
        // child input via focus-within / has-[:focus-visible].
        'focus-within:border-ring',
        'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      {prefix != null && (
        <span aria-hidden="true" className="text-muted-foreground text-md select-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputElRef}
        type="text"
        inputMode="decimal"
        aria-labelledby={labelId}
        value={buffer}
        disabled={disabled}
        onChange={(e) => {
          setBuffer(e.target.value)
          const parsed = parseNumber(e.target.value)
          if (parsed != null) {
            // Preview the committable (clamped) value, matching arrow stepping.
            onChange?.(clamp(parsed, { min, max }))
          }
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent p-0',
          INPUT_TEXT_CLASSES,
          'outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed',
        )}
      />
      {suffix != null && (
        <span aria-hidden="true" className="text-muted-foreground text-md select-none">
          {suffix}
        </span>
      )}
    </label>
  )
}
