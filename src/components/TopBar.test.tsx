import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TopBar } from '@/components/TopBar'

describe('TopBar', () => {
  it('renders the wordmark', () => {
    render(<TopBar />)
    expect(document.querySelector('[data-slot="wordmark"]')).not.toBeNull()
  })

  it('renders the beta badge', () => {
    render(<TopBar />)
    const badge = screen.getByText('beta')
    expect(badge).not.toBeNull()
    expect(badge.getAttribute('data-slot')).toBe('badge')
  })
})
