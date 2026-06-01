import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PanelSection } from './PanelSection'

describe('PanelSection', () => {
  it('renders a section with the title as an h2', () => {
    render(<PanelSection title="Position">content</PanelSection>)
    const heading = screen.getByRole('heading', { level: 2, name: 'Position' })
    expect(heading).toBeInTheDocument()
  })

  it('renders children below the heading', () => {
    render(
      <PanelSection title="Layout">
        <span data-testid="child">inner</span>
      </PanelSection>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('child').closest('section')).toBeInTheDocument()
  })

  it('applies DS heading classes to the h2', () => {
    render(<PanelSection title="Test">content</PanelSection>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.className).toContain('text-xs')
    expect(heading.className).toContain('uppercase')
    expect(heading.className).toContain('text-muted-foreground')
  })

  it('wraps content in a section element', () => {
    const { container } = render(<PanelSection title="Wrap">content</PanelSection>)
    expect(container.querySelector('section')).toBeInTheDocument()
  })
})
