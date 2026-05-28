import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Artboard } from '@/features/canvas/Artboard'

describe('Artboard', () => {
  it('applies surface token classes', () => {
    render(
      <Artboard>
        <span>child</span>
      </Artboard>,
    )

    const wrapper = screen.getByText('child').closest('div')
    expect(wrapper).toHaveClass('bg-card', 'rounded-xl')
  })

  it('does not apply border or shadow classes', () => {
    render(
      <Artboard>
        <span>child</span>
      </Artboard>,
    )

    const wrapper = screen.getByText('child').closest('div')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).not.toMatch(/border/)
    expect(wrapper?.className).not.toMatch(/shadow/)
  })

  it('renders children', () => {
    render(
      <Artboard>
        <span data-testid="inner">hello</span>
      </Artboard>,
    )

    expect(screen.getByTestId('inner')).toBeInTheDocument()
  })
})
