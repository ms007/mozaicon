// Returns number for valid decimal input, undefined for empty/blank, null for invalid.
export function parseNumber(input: string): number | null | undefined {
  const trimmed = input.trim()
  if (trimmed === '') return undefined

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null

  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

export interface ClampOptions {
  min?: number
  max?: number
}

export function clamp(value: number, options?: ClampOptions): number {
  const { min, max } = options ?? {}
  // An inverted range (min > max) is a misconfiguration; collapse to the floor
  // so the result is deterministic rather than depending on the input value.
  if (min != null && max != null && min > max) return min
  if (min != null && value < min) return min
  if (max != null && value > max) return max
  return value
}

export interface StepOptions {
  baseStep: number
  direction: 1 | -1
  coarse?: boolean
  fine?: boolean
  fineStep?: number
}

const DEFAULT_FINE_STEP = 0.1
const COARSE_MULTIPLIER = 10
// Generous cap on rounding precision so a noisy float value can't blow the
// factor up to a scale where rounding stops cleaning drift; no UI needs more.
const MAX_ROUND_DIGITS = 12

export function step(value: number, options: StepOptions): number {
  const { baseStep, direction, coarse, fine, fineStep = DEFAULT_FINE_STEP } = options

  let effectiveStep: number

  if (fine && fineStep !== 0) {
    effectiveStep = fineStep
  } else if (coarse) {
    effectiveStep = baseStep * COARSE_MULTIPLIER
  } else {
    effectiveStep = baseStep
  }

  const raw = value + effectiveStep * direction
  // Round only to undo float-addition drift — keep enough decimals to preserve
  // both the current value and the step, so a coarse step never truncates a
  // finer value already in the field (e.g. 1.55 + coarse 1 stays 2.55, not 2.6).
  const digits = Math.min(
    MAX_ROUND_DIGITS,
    Math.max(decimalPlaces(value), decimalPlaces(effectiveStep)),
  )
  return roundToPrecision(raw, digits)
}

export function roundToPrecision(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// Decimal places the icon model keeps for positions and dimensions. Matching
// Figma's panel rounding, but applied to the stored value (not just display) so
// the data model is the single source of truth and SVG export stays clean.
export const COORD_PRECISION = 2

// Snap a coordinate to model precision. Apply at every boundary that writes
// geometry (commands, draft builders) so a value never carries sub-COORD_PRECISION drift.
export function quantize(value: number): number {
  return roundToPrecision(value, COORD_PRECISION)
}

// Number of fractional digits in a number's decimal representation, including
// magnitudes JS stringifies in scientific notation (e.g. 5e-7 -> 7).
export function decimalPlaces(value: number): number {
  if (!Number.isFinite(value)) return 0
  const s = Math.abs(value).toString()
  const e = s.indexOf('e')
  if (e >= 0) {
    const exponent = Number(s.slice(e + 1))
    const dot = s.indexOf('.')
    const fraction = dot >= 0 ? e - dot - 1 : 0
    return Math.max(0, fraction - exponent)
  }
  const dot = s.indexOf('.')
  return dot >= 0 ? s.length - dot - 1 : 0
}
