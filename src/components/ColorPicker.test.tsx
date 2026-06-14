import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ColorPicker } from '@/components/ColorPicker'

function hexInput() {
  return screen.getByLabelText('Hex color')
}

describe('ColorPicker', () => {
  it('renders the saturation pad and hue slider', () => {
    const { container } = render(<ColorPicker color="#ff0000" onChange={vi.fn()} />)
    expect(container.querySelector('.react-colorful__saturation')).toBeInTheDocument()
    expect(container.querySelector('.react-colorful__hue')).toBeInTheDocument()
  })

  it('displays the hex value (without #) in the input field', () => {
    render(<ColorPicker color="#3b82f6" onChange={vi.fn()} />)
    expect(hexInput()).toHaveValue('3b82f6')
  })

  it('fires onChange when a valid hex is committed via Enter', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#000000" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')

    expect(onChange).toHaveBeenCalledWith('#ff5500')
  })

  it('fires onChange when a valid hex is committed via blur', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#000000" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'aabbcc')
    await userEvent.tab()

    expect(onChange).toHaveBeenCalledWith('#aabbcc')
  })

  it('discards invalid hex on commit and reverts to current color', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#112233" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'zzzz{Enter}')

    expect(input).toHaveValue('112233')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Escape in hex field discards the buffer and keeps current color', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#aabb00" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'ff00ff')
    await userEvent.keyboard('{Escape}')

    expect(input).toHaveValue('aabb00')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Escape does not propagate (would close a parent popover)', async () => {
    const outerHandler = vi.fn()
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={outerHandler}>
        <ColorPicker color="#000000" onChange={vi.fn()} />
      </div>,
    )

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'aaa')
    await userEvent.keyboard('{Escape}')

    const escapeEvents = outerHandler.mock.calls.filter(
      (args) => (args[0] as KeyboardEvent).key === 'Escape',
    )
    expect(escapeEvents).toHaveLength(0)
  })

  it('only allows hex characters in the input (0-9, a-f)', async () => {
    render(<ColorPicker color="#000000" onChange={vi.fn()} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'ggzz12')

    expect(input).toHaveValue('12')
  })

  it('updates the displayed hex when the color prop changes externally', () => {
    const { rerender } = render(<ColorPicker color="#111111" onChange={vi.fn()} />)
    expect(hexInput()).toHaveValue('111111')

    rerender(<ColorPicker color="#222222" onChange={vi.fn()} />)
    expect(hexInput()).toHaveValue('222222')
  })

  it('does not fire onChange when committing the same color', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#abcdef" onChange={onChange} />)

    await userEvent.click(hexInput())
    await userEvent.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('normalizes hex to lowercase', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#000000" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'AABB11{Enter}')

    expect(onChange).toHaveBeenCalledWith('#aabb11')
  })

  it('calls onEscape when Escape is pressed in the hex field', async () => {
    const onEscape = vi.fn()
    render(<ColorPicker color="#000000" onChange={vi.fn()} onEscape={onEscape} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    await userEvent.keyboard('{Escape}')

    expect(onEscape).toHaveBeenCalledOnce()
  })

  it('reverts partial-length hex (3 valid chars) on commit', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#112233" onChange={onChange} />)

    const input = hexInput()
    await userEvent.clear(input)
    await userEvent.type(input, 'abc{Enter}')

    expect(input).toHaveValue('112233')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the RGB channels decoded from the current hex', () => {
    render(<ColorPicker color="#222222" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Red')).toHaveValue('34')
    expect(screen.getByLabelText('Green')).toHaveValue('34')
    expect(screen.getByLabelText('Blue')).toHaveValue('34')
  })

  it('commits a hex rebuilt from an edited RGB channel', async () => {
    const onChange = vi.fn()
    render(<ColorPicker color="#000000" onChange={onChange} />)

    const red = screen.getByLabelText('Red')
    await userEvent.clear(red)
    await userEvent.type(red, '255{Enter}')

    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('clamps an out-of-range RGB channel to 255', async () => {
    const onChange = vi.fn()

    function Controlled() {
      const [color, setColor] = useState('#000000')
      return (
        <ColorPicker
          color={color}
          onChange={(hex) => {
            onChange(hex)
            setColor(hex)
          }}
        />
      )
    }

    render(<Controlled />)

    const green = screen.getByLabelText('Green')
    await userEvent.clear(green)
    await userEvent.type(green, '999')
    await userEvent.tab()

    expect(onChange).toHaveBeenCalledWith('#00ff00')
    expect(green).toHaveValue('255')
  })

  it('renders a 3-digit hex without crashing and expands its RGB channels', () => {
    render(<ColorPicker color="#000" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Red')).toHaveValue('0')
    expect(screen.getByLabelText('Green')).toHaveValue('0')
    expect(screen.getByLabelText('Blue')).toHaveValue('0')
  })

  it('decodes a 3-digit hex like #abc as #aabbcc', () => {
    render(<ColorPicker color="#abc" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Red')).toHaveValue('170')
    expect(screen.getByLabelText('Green')).toHaveValue('187')
    expect(screen.getByLabelText('Blue')).toHaveValue('204')
  })

  it('renders a colour preview swatch and a presentational alpha track', () => {
    const { container } = render(<ColorPicker color="#ff0000" onChange={vi.fn()} />)
    const preview = container.querySelector<HTMLElement>('.color-picker-preview')
    expect(preview).toBeInTheDocument()
    expect(preview?.style.backgroundColor).toBe('#ff0000')
    expect(container.querySelector('.color-picker-alpha')).toBeInTheDocument()
    expect(screen.getByLabelText('Opacity (not editable)')).toBeDisabled()
  })
})
