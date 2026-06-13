import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Divider } from './Divider'

describe('Divider', () => {
  it('renders a horizontal separator', () => {
    render(<Divider />)
    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('is a top-border hairline', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toHaveClass('border-t')
  })
})
