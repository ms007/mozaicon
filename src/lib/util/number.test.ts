import { describe, expect, it } from 'vitest'

import { clamp, decimalPlaces, parseNumber, roundToPrecision, step } from './number'

describe('parseNumber', () => {
  it('parses a valid integer string', () => {
    expect(parseNumber('42')).toBe(42)
  })

  it('parses a valid float string', () => {
    expect(parseNumber('3.14')).toBe(3.14)
  })

  it('parses a negative number', () => {
    expect(parseNumber('-7')).toBe(-7)
  })

  it('parses zero', () => {
    expect(parseNumber('0')).toBe(0)
  })

  it('parses a string with leading/trailing whitespace', () => {
    expect(parseNumber('  5  ')).toBe(5)
  })

  it('returns undefined for an empty string', () => {
    expect(parseNumber('')).toBeUndefined()
  })

  it('returns undefined for whitespace-only string', () => {
    expect(parseNumber('   ')).toBeUndefined()
  })

  it('returns null for an invalid string', () => {
    expect(parseNumber('abc')).toBeNull()
  })

  it('returns null for a partially numeric string', () => {
    expect(parseNumber('12px')).toBeNull()
  })

  it('returns null for NaN-producing input', () => {
    expect(parseNumber('NaN')).toBeNull()
  })

  it('returns null for Infinity', () => {
    expect(parseNumber('Infinity')).toBeNull()
  })

  it('returns null for negative Infinity', () => {
    expect(parseNumber('-Infinity')).toBeNull()
  })

  it('returns null for hex notation', () => {
    expect(parseNumber('0x10')).toBeNull()
    expect(parseNumber('0X1F')).toBeNull()
  })

  it('returns null for binary notation', () => {
    expect(parseNumber('0b10')).toBeNull()
    expect(parseNumber('0B110')).toBeNull()
  })

  it('returns null for octal notation', () => {
    expect(parseNumber('0o10')).toBeNull()
    expect(parseNumber('0O77')).toBeNull()
  })

  it('returns null for scientific notation', () => {
    expect(parseNumber('1e3')).toBeNull()
    expect(parseNumber('1E3')).toBeNull()
    expect(parseNumber('1.5e2')).toBeNull()
    expect(parseNumber('-1e-3')).toBeNull()
  })

  it('parses leading decimal point', () => {
    expect(parseNumber('.5')).toBe(0.5)
  })

  it('parses trailing decimal point', () => {
    expect(parseNumber('3.')).toBe(3)
  })

  it('parses leading plus sign', () => {
    expect(parseNumber('+5')).toBe(5)
  })
})

describe('clamp', () => {
  it('returns the value when within bounds', () => {
    expect(clamp(5, { min: 0, max: 10 })).toBe(5)
  })

  it('clamps to min when below', () => {
    expect(clamp(-3, { min: 0, max: 10 })).toBe(0)
  })

  it('clamps to max when above', () => {
    expect(clamp(15, { min: 0, max: 10 })).toBe(10)
  })

  it('respects only min when max is omitted', () => {
    expect(clamp(-5, { min: 0 })).toBe(0)
    expect(clamp(1000, { min: 0 })).toBe(1000)
  })

  it('respects only max when min is omitted', () => {
    expect(clamp(-1000, { max: 10 })).toBe(-1000)
    expect(clamp(15, { max: 10 })).toBe(10)
  })

  it('passes through when both min and max are omitted', () => {
    expect(clamp(42, {})).toBe(42)
  })

  it('passes through when no options provided', () => {
    expect(clamp(42)).toBe(42)
  })

  it('handles min equal to max', () => {
    expect(clamp(5, { min: 3, max: 3 })).toBe(3)
  })

  it('collapses an inverted range (min > max) to the floor deterministically', () => {
    expect(clamp(3, { min: 10, max: 5 })).toBe(10)
    expect(clamp(20, { min: 10, max: 5 })).toBe(10)
    expect(clamp(7, { min: 10, max: 5 })).toBe(10)
  })
})

describe('step', () => {
  it('applies base step upward', () => {
    expect(step(10, { baseStep: 1, direction: 1 })).toBe(11)
  })

  it('applies base step downward', () => {
    expect(step(10, { baseStep: 1, direction: -1 })).toBe(9)
  })

  it('applies coarse modifier (×10)', () => {
    expect(step(10, { baseStep: 1, direction: 1, coarse: true })).toBe(20)
  })

  it('applies fine modifier (×fineStep)', () => {
    expect(step(10, { baseStep: 1, direction: 1, fine: true, fineStep: 0.1 })).toBe(10.1)
  })

  it('fine wins when both coarse and fine are set', () => {
    expect(step(10, { baseStep: 1, direction: 1, coarse: true, fine: true, fineStep: 0.1 })).toBe(
      10.1,
    )
  })

  it('uses default fineStep of 0.1 when not specified', () => {
    expect(step(10, { baseStep: 1, direction: 1, fine: true })).toBe(10.1)
  })

  it('fineStep of 0 disables fine stepping (uses base step)', () => {
    expect(step(10, { baseStep: 1, direction: 1, fine: true, fineStep: 0 })).toBe(11)
  })

  it('fineStep of 0 with coarse falls back to coarse', () => {
    expect(step(10, { baseStep: 1, direction: 1, fine: true, coarse: true, fineStep: 0 })).toBe(20)
  })

  it('applies fine modifier downward', () => {
    expect(step(10, { baseStep: 1, direction: -1, fine: true, fineStep: 0.1 })).toBe(9.9)
  })

  it('applies custom base step', () => {
    expect(step(0, { baseStep: 5, direction: 1 })).toBe(5)
  })

  it('applies coarse with custom base step', () => {
    expect(step(0, { baseStep: 5, direction: 1, coarse: true })).toBe(50)
  })

  it('repeated fine steps do not produce float drift', () => {
    let value = 0
    for (let i = 0; i < 10; i++) {
      value = step(value, { baseStep: 1, direction: 1, fine: true, fineStep: 0.1 })
    }
    expect(value).toBe(1)
  })

  it('repeated base steps stay clean', () => {
    let value = 0
    for (let i = 0; i < 100; i++) {
      value = step(value, { baseStep: 0.1, direction: 1 })
    }
    expect(value).toBe(10)
  })

  it('preserves finer decimals already in the value when stepping by an integer', () => {
    expect(step(5.99, { baseStep: 1, direction: 1 })).toBe(6.99)
    expect(step(100.25, { baseStep: 1, direction: 1 })).toBe(101.25)
  })

  it('coarse stepping does not truncate the value precision', () => {
    expect(step(1.55, { baseStep: 0.1, direction: 1, coarse: true })).toBe(2.55)
  })

  it('preserves a fractional base step >= 1', () => {
    expect(step(0, { baseStep: 1.25, direction: 1 })).toBe(1.25)
  })
})

describe('roundToPrecision', () => {
  it('rounds away floating-point drift', () => {
    expect(roundToPrecision(0.1 + 0.2, 1)).toBe(0.3)
  })

  it('rounds to the given number of decimals', () => {
    expect(roundToPrecision(1.23456, 2)).toBe(1.23)
  })

  it('zero decimals rounds to integers', () => {
    expect(roundToPrecision(3.7, 0)).toBe(4)
  })

  it('three decimals keeps three places', () => {
    expect(roundToPrecision(1.23456, 3)).toBe(1.235)
  })

  it('handles negative values', () => {
    expect(roundToPrecision(-0.1 - 0.2, 1)).toBe(-0.3)
  })

  it('handles zero', () => {
    expect(roundToPrecision(0, 1)).toBe(0)
  })
})

describe('decimalPlaces', () => {
  it('returns 0 for integers', () => {
    expect(decimalPlaces(1)).toBe(0)
    expect(decimalPlaces(100)).toBe(0)
  })

  it('counts fractional digits', () => {
    expect(decimalPlaces(1.5)).toBe(1)
    expect(decimalPlaces(0.001)).toBe(3)
  })

  it('counts digits for scientific-notation magnitudes', () => {
    expect(decimalPlaces(5e-7)).toBe(7)
    expect(decimalPlaces(1.5e-7)).toBe(8)
  })

  it('ignores sign', () => {
    expect(decimalPlaces(-2.25)).toBe(2)
  })
})
