import { describe, expect, it } from 'vitest'

import { toKebabSlug, toPascalComponentName } from './naming'

describe('toKebabSlug', () => {
  it('converts a CamelCase name to kebab-case', () => {
    expect(toKebabSlug('MyIcon')).toBe('my-icon')
  })

  it('converts spaces to hyphens', () => {
    expect(toKebabSlug('My Cool Icon')).toBe('my-cool-icon')
  })

  it('converts "Untitled" to its slug normally', () => {
    expect(toKebabSlug('Untitled')).toBe('untitled')
  })

  it('falls back to "icon" for an empty string', () => {
    expect(toKebabSlug('')).toBe('icon')
  })

  it('falls back to "icon" for whitespace-only input', () => {
    expect(toKebabSlug('   ')).toBe('icon')
  })

  it('falls back to "icon" for strings that collapse to empty after stripping non-alphanumeric', () => {
    expect(toKebabSlug('---')).toBe('icon')
  })

  it('collapses multiple hyphens', () => {
    expect(toKebabSlug('foo   bar')).toBe('foo-bar')
  })

  it('strips leading and trailing hyphens', () => {
    expect(toKebabSlug(' -foo- ')).toBe('foo')
  })

  it('lowercases all characters', () => {
    expect(toKebabSlug('FOO BAR')).toBe('foo-bar')
  })

  it('handles mixed separators and casing', () => {
    expect(toKebabSlug('Hello_World Test')).toBe('hello-world-test')
  })

  it('preserves digits', () => {
    expect(toKebabSlug('Icon 2x')).toBe('icon-2x')
  })

  it('handles single word', () => {
    expect(toKebabSlug('arrow')).toBe('arrow')
  })
})

describe('toPascalComponentName', () => {
  it('converts a kebab-style name to PascalCase', () => {
    expect(toPascalComponentName('my-icon')).toBe('MyIcon')
  })

  it('converts a CamelCase name to PascalCase', () => {
    expect(toPascalComponentName('myIcon')).toBe('MyIcon')
  })

  it('converts a spaced name to PascalCase', () => {
    expect(toPascalComponentName('My Cool Icon')).toBe('MyCoolIcon')
  })

  it('falls back to "Icon" for an empty string', () => {
    expect(toPascalComponentName('')).toBe('Icon')
  })

  it('falls back to "Icon" for whitespace-only input', () => {
    expect(toPascalComponentName('   ')).toBe('Icon')
  })

  it('falls back to "Icon" for non-alphanumeric input', () => {
    expect(toPascalComponentName('---')).toBe('Icon')
  })

  it('prefixes "Icon" when name starts with a digit', () => {
    expect(toPascalComponentName('2x-arrow')).toBe('Icon2xArrow')
  })

  it('prefixes "Icon" for digit-only name', () => {
    expect(toPascalComponentName('123')).toBe('Icon123')
  })

  it('handles single word', () => {
    expect(toPascalComponentName('arrow')).toBe('Arrow')
  })

  it('converts "Untitled" to PascalCase', () => {
    expect(toPascalComponentName('Untitled')).toBe('Untitled')
  })

  it('handles mixed separators', () => {
    expect(toPascalComponentName('Hello_World Test')).toBe('HelloWorldTest')
  })
})
