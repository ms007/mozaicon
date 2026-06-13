import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PropertyRow } from './PropertyRow'

describe('PropertyRow', () => {
  it('reserves the gutter column even when no gutter content is supplied', () => {
    const { container } = render(<PropertyRow>Content</PropertyRow>)
    const row = container.querySelector('[data-slot="property-row"]')
    expect(row).toHaveStyle({ gridTemplateColumns: 'minmax(0, 1fr) 28px' })
  })

  it('renders gutter content in the right-hand slot', () => {
    render(<PropertyRow gutter={<button>icon</button>}>Content</PropertyRow>)
    const button = screen.getByRole('button', { name: 'icon' })
    expect(button).toBeInTheDocument()
    expect(button.parentElement).toHaveClass('col-start-2')
  })

  it('forwards custom className to the grid root', () => {
    const { container } = render(<PropertyRow className="my-custom-class">Content</PropertyRow>)
    const row = container.querySelector('[data-slot="property-row"]')
    expect(row).toHaveClass('my-custom-class')
    expect(row).toHaveClass('grid')
  })

  it('top-aligns the gutter action when content spans multiple rows', () => {
    const { container } = render(
      <PropertyRow gutter={<button>icon</button>}>
        <div>Row 1</div>
        <div>Row 2</div>
      </PropertyRow>,
    )
    const row = container.querySelector('[data-slot="property-row"]')
    expect(row).toHaveClass('items-start')
  })
})
