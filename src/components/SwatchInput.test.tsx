import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SwatchInput } from '@/components/SwatchInput'

function hexInput() {
  return screen.getByLabelText('Hex color')
}

describe('SwatchInput', () => {
  it('renders a swatch reflecting the color and the hex value without #', () => {
    render(<SwatchInput color="#3b82f6" onChange={vi.fn()} />)
    const swatch = screen.getByLabelText('Edit color')
    expect(swatch.style.backgroundColor).toBe('#3b82f6')
    expect(hexInput()).toHaveValue('3b82f6')
  })

  it('uses a custom swatch label when provided', () => {
    render(<SwatchInput color="#000000" onChange={vi.fn()} swatchLabel="Stroke color" />)
    expect(screen.getByLabelText('Stroke color')).toBeInTheDocument()
  })

  it('fires onSwatchClick when the swatch is clicked', async () => {
    const onSwatchClick = vi.fn()
    render(<SwatchInput color="#000000" onChange={vi.fn()} onSwatchClick={onSwatchClick} />)

    await userEvent.click(screen.getByLabelText('Edit color'))
    expect(onSwatchClick).toHaveBeenCalledOnce()
  })

  it('commits a valid hex via Enter', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#000000" onChange={onChange} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'ff5500{Enter}')

    expect(onChange).toHaveBeenCalledWith('#ff5500')
  })

  it('commits a valid hex via blur', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#000000" onChange={onChange} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'aabbcc')
    await userEvent.tab()

    expect(onChange).toHaveBeenCalledWith('#aabbcc')
  })

  it('reverts an invalid hex on commit and keeps the current color', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#112233" onChange={onChange} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'zzzz{Enter}')

    expect(hexInput()).toHaveValue('112233')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reverts a partial-length hex (3 chars) on commit', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#112233" onChange={onChange} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'abc{Enter}')

    expect(hexInput()).toHaveValue('112233')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('only accepts hex characters in the field', async () => {
    render(<SwatchInput color="#000000" onChange={vi.fn()} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'ggzz12')

    expect(hexInput()).toHaveValue('12')
  })

  it('normalizes committed hex to lowercase', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#000000" onChange={onChange} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'AABB11{Enter}')

    expect(onChange).toHaveBeenCalledWith('#aabb11')
  })

  it('does not fire onChange when committing the same color', async () => {
    const onChange = vi.fn()
    render(<SwatchInput color="#abcdef" onChange={onChange} />)

    await userEvent.click(hexInput())
    await userEvent.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('Escape reverts the buffer and calls onEscape without committing', async () => {
    const onChange = vi.fn()
    const onEscape = vi.fn()
    render(<SwatchInput color="#aabb00" onChange={onChange} onEscape={onEscape} />)

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'ff00ff')
    await userEvent.keyboard('{Escape}')

    expect(hexInput()).toHaveValue('aabb00')
    expect(onChange).not.toHaveBeenCalled()
    expect(onEscape).toHaveBeenCalledOnce()
  })

  it('Escape does not propagate (would close a parent popover)', async () => {
    const outerHandler = vi.fn()
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={outerHandler}>
        <SwatchInput color="#000000" onChange={vi.fn()} />
      </div>,
    )

    await userEvent.clear(hexInput())
    await userEvent.type(hexInput(), 'aaa')
    await userEvent.keyboard('{Escape}')

    const escapeEvents = outerHandler.mock.calls.filter(
      (args) => (args[0] as KeyboardEvent).key === 'Escape',
    )
    expect(escapeEvents).toHaveLength(0)
  })

  it('updates the displayed hex when the color prop changes externally', () => {
    const { rerender } = render(<SwatchInput color="#111111" onChange={vi.fn()} />)
    expect(hexInput()).toHaveValue('111111')

    rerender(<SwatchInput color="#222222" onChange={vi.fn()} />)
    expect(hexInput()).toHaveValue('222222')
  })

  it('marks the swatch active when swatchActive is set', () => {
    render(<SwatchInput color="#000000" onChange={vi.fn()} swatchActive />)
    expect(screen.getByLabelText('Edit color')).toHaveAttribute('data-active', 'true')
  })

  it('shows an empty field with a placeholder for a non-hex (mixed) color', () => {
    render(<SwatchInput color="transparent" onChange={vi.fn()} placeholder="Mixed" />)
    expect(hexInput()).toHaveValue('')
    expect(hexInput()).toHaveAttribute('placeholder', 'Mixed')
  })

  it('uses a custom hex field label', () => {
    render(<SwatchInput color="#000000" onChange={vi.fn()} hexLabel="Stroke color hex" />)
    expect(screen.getByLabelText('Stroke color hex')).toBeInTheDocument()
  })

  it('forwards extra props (e.g. data-slot) onto the root element', () => {
    const { container } = render(
      <SwatchInput color="#000000" onChange={vi.fn()} data-slot="stroke-color-trigger" />,
    )
    expect(container.querySelector('[data-slot="stroke-color-trigger"]')).toBeInTheDocument()
  })
})
