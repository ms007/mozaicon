import { cleanup, render, screen } from '@testing-library/react'

import { resolveToken } from './resolve-token'
import { TypeSpecimen } from './TypeSpecimen'

function setVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

function removeVar(name: string) {
  document.documentElement.style.removeProperty(name)
}

afterEach(() => {
  cleanup()
  document.documentElement.className = ''
  ;[
    '--text-base',
    '--text-base--line-height',
    '--text-sm',
    '--text-sm--line-height',
    '--font-sans',
    '--font-weight-bold',
  ].forEach(removeVar)
})

describe('resolveToken', () => {
  it('resolves a set CSS variable', () => {
    setVar('--text-base', '0.8125rem')
    expect(resolveToken(document.documentElement, '--text-base')).toBe('0.8125rem')
  })

  it('returns fallback for missing variable', () => {
    expect(resolveToken(document.documentElement, '--nonexistent', '1rem')).toBe('1rem')
  })

  it('returns empty string for missing variable without fallback', () => {
    expect(resolveToken(document.documentElement, '--nonexistent')).toBe('')
  })

  it('trims whitespace from resolved values', () => {
    setVar('--text-base', '  0.8125rem  ')
    expect(resolveToken(document.documentElement, '--text-base')).toBe('0.8125rem')
  })

  it('reads from a specific element', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    div.style.setProperty('--custom', '42px')
    expect(resolveToken(div, '--custom')).toBe('42px')
    div.remove()
  })
})

describe('TypeSpecimen', () => {
  beforeEach(() => {
    setVar('--text-base', '0.8125rem')
    setVar('--text-base--line-height', '1.5')
  })

  it('renders default sample text', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    expect(screen.getByText(/quick brown fox/)).toBeInTheDocument()
  })

  it('renders custom sample text', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" sampleText="Custom sample" />)
    expect(screen.getByText('Custom sample')).toBeInTheDocument()
  })

  it('displays the label', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    expect(screen.getByText('text-base')).toBeInTheDocument()
  })

  it('shows resolved size and line-height in meta', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    expect(screen.getByTestId('specimen-meta')).toHaveTextContent('0.8125rem / 1.5')
  })

  it('applies resolved font-size to sample text', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.fontSize).toBe('0.8125rem')
  })

  it('applies resolved line-height to sample text', () => {
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.lineHeight).toBe('1.5')
  })

  it('applies font-family when fontFamilyVar is provided', () => {
    setVar('--font-sans', 'system-ui, sans-serif')
    render(<TypeSpecimen sizeVar="--text-base" label="text-base" fontFamilyVar="--font-sans" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.fontFamily).toContain('system-ui')
  })

  it('applies font-weight when fontWeightVar is provided', () => {
    setVar('--font-weight-bold', '700')
    render(
      <TypeSpecimen sizeVar="--text-base" label="text-base" fontWeightVar="--font-weight-bold" />,
    )
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.fontWeight).toBe('700')
  })
})

describe('fallback behavior', () => {
  it('uses fallback size when variable is missing', () => {
    render(<TypeSpecimen sizeVar="--missing" label="missing" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.fontSize).toBe('1rem')
  })

  it('uses fallback line-height when variable is missing', () => {
    render(<TypeSpecimen sizeVar="--missing" label="missing" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.lineHeight).toBe('1.5')
  })

  it('renders without crashing when all variables are missing', () => {
    render(
      <TypeSpecimen
        sizeVar="--missing"
        label="missing"
        fontFamilyVar="--also-missing"
        fontWeightVar="--nope"
      />,
    )
    expect(screen.getByText(/quick brown fox/)).toBeInTheDocument()
  })

  it('omits font-family style when variable resolves empty', () => {
    render(<TypeSpecimen sizeVar="--missing" label="missing" fontFamilyVar="--also-missing" />)
    const sample = screen.getByTestId('specimen-sample')
    expect(sample.style.fontFamily).toBe('')
  })
})

describe('theme-class reactivity', () => {
  it('picks up new token values on re-mount after theme change', () => {
    setVar('--text-sm', '0.6875rem')
    setVar('--text-sm--line-height', '1.3')

    const { unmount } = render(<TypeSpecimen sizeVar="--text-sm" label="text-sm" />)
    expect(screen.getByTestId('specimen-meta')).toHaveTextContent('0.6875rem / 1.3')
    unmount()

    // Simulate theme switch: class changes and tokens update
    document.documentElement.classList.add('dark')
    setVar('--text-sm', '0.75rem')
    setVar('--text-sm--line-height', '1.4')

    render(<TypeSpecimen sizeVar="--text-sm" label="text-sm" />)
    expect(screen.getByTestId('specimen-meta')).toHaveTextContent('0.75rem / 1.4')
  })

  it('reads from the current class context without crashing', () => {
    document.documentElement.classList.add('dark')
    setVar('--text-base', '0.8125rem')
    setVar('--text-base--line-height', '1.5')

    render(<TypeSpecimen sizeVar="--text-base" label="text-base" />)
    expect(screen.getByText(/quick brown fox/)).toBeInTheDocument()
  })
})
