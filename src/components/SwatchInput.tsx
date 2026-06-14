import { type ComponentProps, type KeyboardEvent, useRef, useState } from 'react'

import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { Swatch } from '@/components/Swatch'
import { cn } from '@/lib/utils'

const HEX6_RE = /^[0-9a-f]{6}$/i
const HEX_DISPLAY_RE = /^([0-9a-f]{3}|[0-9a-f]{6})$/i

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, '')
  if (!HEX6_RE.test(trimmed)) return null
  return `#${trimmed.toLowerCase()}`
}

// What the field shows for an incoming color: the bare hex digits for a 3- or
// 6-digit hex, or '' for anything else (e.g. 'transparent' or a mixed
// selection) so the field falls back to its placeholder instead of printing a
// non-hex string.
function toHexDigits(color: string): string {
  const trimmed = color.trim().replace(/^#/, '')
  return HEX_DISPLAY_RE.test(trimmed) ? trimmed : ''
}

// `has-[input:...]` (not `has-[:...]`) so the field outline reacts only to the
// hex input — the swatch button owns its own focus ring.
const FIELD_CLASSES = cn(
  INPUT_SURFACE_CLASSES,
  'flex min-w-0 items-center gap-1.5',
  'transition-colors',
  'focus-within:border-ring',
  'has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-solid',
)

const FIELD_INPUT_CLASSES = cn(
  'min-w-0 flex-1 border-0 bg-transparent p-0',
  INPUT_TEXT_CLASSES,
  'uppercase outline-none',
  'placeholder:text-muted-foreground placeholder:normal-case placeholder:italic',
)

export type SwatchInputProps = Omit<ComponentProps<'div'>, 'color' | 'onChange'> & {
  /** Current color as a hex string (the swatch fill and the field's source of truth). */
  color: string
  /** Fired with a normalized `#rrggbb` hex when the field commits a valid value. */
  onChange: (hex: string) => void
  /** Click on the swatch prefix — wire this to open a color picker. */
  onSwatchClick?: () => void
  /** Highlights the swatch (e.g. while its picker is open). */
  swatchActive?: boolean
  /** Accessible label for the swatch trigger. */
  swatchLabel?: string
  /** Accessible label for the hex text field (keep unique across the screen). */
  hexLabel?: string
  /** Shown when the color is non-hex (e.g. a mixed selection). */
  placeholder?: string
  /** Fired after Escape reverts the in-progress edit (e.g. to close a picker). */
  onEscape?: () => void
}

export function SwatchInput({
  color,
  onChange,
  onSwatchClick,
  swatchActive = false,
  swatchLabel = 'Edit color',
  hexLabel = 'Hex color',
  placeholder,
  onEscape,
  className,
  ...rest
}: SwatchInputProps) {
  const [buffer, setBuffer] = useState(() => toHexDigits(color))
  const [baseColor, setBaseColor] = useState(color)
  const inputRef = useRef<HTMLInputElement>(null)

  if (color !== baseColor) {
    setBaseColor(color)
    setBuffer(toHexDigits(color))
  }

  function commitBuffer() {
    const hex = normalizeHex(buffer)
    if (hex) {
      setBuffer(hex.slice(1))
      if (hex !== baseColor) {
        setBaseColor(hex)
        onChange(hex)
      }
    } else {
      setBuffer(toHexDigits(baseColor))
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
      e.stopPropagation()
      setBuffer(toHexDigits(baseColor))
      inputRef.current?.select()
      onEscape?.()
    }
  }

  return (
    <div data-slot="swatch-input" {...rest} className={cn(FIELD_CLASSES, className)}>
      <Swatch
        color={color}
        active={swatchActive}
        onSelect={onSwatchClick}
        aria-label={swatchLabel}
        className="size-4"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label={hexLabel}
        value={buffer}
        placeholder={placeholder}
        onChange={(e) => {
          if (/^[0-9a-f]{0,6}$/i.test(e.target.value)) setBuffer(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        onBlur={commitBuffer}
        className={FIELD_INPUT_CLASSES}
      />
    </div>
  )
}
