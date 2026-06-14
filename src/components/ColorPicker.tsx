import './ColorPicker.css' // react-colorful DS overrides + picker layout

import { type CSSProperties, type KeyboardEvent, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

import { INPUT_SURFACE_CLASSES, INPUT_TEXT_CLASSES } from '@/components/primitives/Input'
import { cn } from '@/lib/utils'

const HEX6_RE = /^[0-9a-f]{6}$/i

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, '')
  if (!HEX6_RE.test(trimmed)) return null
  return `#${trimmed.toLowerCase()}`
}

// Tolerate 3-digit and otherwise-malformed hex: strokes can arrive from
// imported SVG or the addStroke '#000' fallback, and a NaN channel would feed
// an `x !== NaN`-always-true render loop in ChannelInput.
function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace(/^#/, '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const channel = (start: number) => {
    const n = Number.parseInt(full.slice(start, start + 2), 16)
    return Number.isFinite(n) ? n : 0
  }
  return [channel(0), channel(2), channel(4)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

const FIELD_CLASSES = cn(
  INPUT_SURFACE_CLASSES,
  'flex min-w-0 items-center gap-1',
  'transition-colors',
  'focus-within:border-ring',
  'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid',
)

const FIELD_INPUT_CLASSES = cn(
  'min-w-0 flex-1 border-0 bg-transparent p-0',
  INPUT_TEXT_CLASSES,
  'outline-none',
  'placeholder:text-muted-foreground',
)

type ChannelInputProps = {
  label: string
  value: number
  onCommit: (value: number) => void
}

function ChannelInput({ label, value, onCommit }: ChannelInputProps) {
  const [buffer, setBuffer] = useState(() => String(value))
  const [base, setBase] = useState(value)

  if (value !== base) {
    setBase(value)
    setBuffer(String(value))
  }

  function commit() {
    const parsed = Number.parseInt(buffer, 10)
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(0, Math.min(255, parsed))
      setBuffer(String(clamped))
      if (clamped !== base) {
        setBase(clamped)
        onCommit(clamped)
      }
    } else {
      setBuffer(String(base))
    }
  }

  return (
    <label className={cn(FIELD_CLASSES, 'flex-1 justify-center px-1')}>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={buffer}
        onChange={(e) => {
          if (/^\d{0,3}$/.test(e.target.value)) setBuffer(e.target.value)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        className={cn(FIELD_INPUT_CLASSES, 'text-center tabular-nums')}
      />
    </label>
  )
}

export type ColorPickerProps = {
  color: string
  onChange: (hex: string) => void
  onEscape?: () => void
}

export function ColorPicker({ color, onChange, onEscape }: ColorPickerProps) {
  const [buffer, setBuffer] = useState(() => color.replace(/^#/, ''))
  const [baseColor, setBaseColor] = useState(color)
  const inputRef = useRef<HTMLInputElement>(null)

  if (color !== baseColor) {
    setBaseColor(color)
    setBuffer(color.replace(/^#/, ''))
  }

  function applyHex(hex: string) {
    const lower = hex.toLowerCase()
    setBaseColor(lower)
    setBuffer(lower.replace(/^#/, ''))
    onChange(lower)
  }

  function commitBuffer() {
    const hex = normalizeHex(buffer)
    if (hex) {
      setBuffer(hex.replace(/^#/, ''))
      if (hex !== baseColor) applyHex(hex)
    } else {
      setBuffer(baseColor.replace(/^#/, ''))
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (/^[0-9a-f]{0,6}$/i.test(raw)) {
      setBuffer(raw)
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
      setBuffer(baseColor.replace(/^#/, ''))
      inputRef.current?.select()
      onEscape?.()
    }
  }

  const [r, g, b] = hexToRgb(color)
  const commitChannel = (index: 0 | 1 | 2) => (next: number) => {
    const rgb: [number, number, number] = [r, g, b]
    rgb[index] = next
    applyHex(rgbToHex(rgb[0], rgb[1], rgb[2]))
  }

  return (
    <div data-slot="color-picker" className="flex flex-col gap-3">
      <div className="color-picker-board">
        <HexColorPicker color={color} onChange={applyHex} />
        <span
          className="color-picker-preview"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span
          className="color-picker-alpha"
          style={{ '--picker-color': color } as CSSProperties}
          aria-hidden="true"
        >
          <span className="color-picker-alpha-knob" />
        </span>
      </div>

      <div className="flex gap-1">
        <label className={cn(FIELD_CLASSES, 'flex-[1.8]')}>
          <span aria-hidden="true" className="text-muted-foreground text-md select-none">
            #
          </span>
          <input
            ref={inputRef}
            type="text"
            aria-label="Hex color"
            value={buffer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={commitBuffer}
            className={cn(FIELD_INPUT_CLASSES, 'uppercase')}
          />
        </label>
        <ChannelInput label="Red" value={r} onCommit={commitChannel(0)} />
        <ChannelInput label="Green" value={g} onCommit={commitChannel(1)} />
        <ChannelInput label="Blue" value={b} onCommit={commitChannel(2)} />
        <label className={cn(FIELD_CLASSES, 'flex-1 justify-center px-1 opacity-50')}>
          <input
            type="text"
            aria-label="Opacity (not editable)"
            value="100"
            disabled
            readOnly
            className={cn(FIELD_INPUT_CLASSES, 'text-center tabular-nums')}
          />
        </label>
      </div>
    </div>
  )
}
