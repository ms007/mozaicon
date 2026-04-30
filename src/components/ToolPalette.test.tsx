import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/primitives/Tooltip'
import { type ToolOption, ToolPalette } from '@/components/ToolPalette'

const TOOL_OPTIONS: ToolOption[] = [
  {
    value: 'rect',
    icon: <span data-testid="icon-rect">R</span>,
    label: 'Rectangle',
    shortcut: 'R',
  },
  {
    value: 'ellipse',
    icon: <span data-testid="icon-ellipse">E</span>,
    label: 'Ellipse',
    shortcut: 'O',
  },
  { value: 'line', icon: <span data-testid="icon-line">L</span>, label: 'Line' },
]

function renderPalette(props: Partial<Parameters<typeof ToolPalette>[0]> = {}) {
  const defaultProps: Parameters<typeof ToolPalette>[0] = {
    options: TOOL_OPTIONS,
    value: 'rect',
    onChange: () => undefined,
    ...props,
  }
  return render(
    <TooltipProvider>
      <ToolPalette {...defaultProps} />
    </TooltipProvider>,
  )
}

describe('ToolPalette', () => {
  it('renders one ToggleGroupItem per option', () => {
    renderPalette()

    for (const option of TOOL_OPTIONS) {
      expect(screen.getByRole('radio', { name: option.label })).toBeInTheDocument()
    }
  })

  it('marks the active item with data-state="on"', () => {
    renderPalette({ value: 'ellipse' })

    expect(screen.getByRole('radio', { name: 'Ellipse' })).toHaveAttribute('data-state', 'on')
    expect(screen.getByRole('radio', { name: 'Rectangle' })).toHaveAttribute('data-state', 'off')
  })

  it('fires onChange with the clicked item value', async () => {
    const onChange = vi.fn()
    renderPalette({ onChange })

    await userEvent.click(screen.getByRole('radio', { name: 'Ellipse' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('ellipse')
  })

  it('does not fire onChange when re-clicking the active item', async () => {
    const onChange = vi.fn()
    renderPalette({ onChange, value: 'rect' })

    await userEvent.click(screen.getByRole('radio', { name: 'Rectangle' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('propagates aria-label onto the container', () => {
    renderPalette({ 'aria-label': 'Drawing tools' })

    expect(screen.getByRole('group', { name: 'Drawing tools' })).toBeInTheDocument()
  })

  it('renders an empty group when options is empty', () => {
    renderPalette({ options: [], 'aria-label': 'Empty palette' })

    expect(screen.getByRole('group', { name: 'Empty palette' })).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('marks all items off when value matches no option', () => {
    renderPalette({ value: 'nonexistent' })

    for (const option of TOOL_OPTIONS) {
      expect(screen.getByRole('radio', { name: option.label })).toHaveAttribute('data-state', 'off')
    }
  })

  it('merges className onto the container', () => {
    renderPalette({ className: 'custom-class', 'aria-label': 'Styled palette' })

    const group = screen.getByRole('group', { name: 'Styled palette' })
    expect(group.className).toContain('custom-class')
  })

  describe('onItemClick', () => {
    it('fires onItemClick with clicked value when clicking a non-active item', async () => {
      const onItemClick = vi.fn()
      const onChange = vi.fn()
      renderPalette({ onItemClick, onChange, value: 'rect' })

      await userEvent.click(screen.getByRole('radio', { name: 'Ellipse' }))

      expect(onItemClick).toHaveBeenCalledTimes(1)
      expect(onItemClick).toHaveBeenCalledWith('ellipse')
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('ellipse')
    })

    it('fires onItemClick but not onChange when re-clicking the active item', async () => {
      const onItemClick = vi.fn()
      const onChange = vi.fn()
      renderPalette({ onItemClick, onChange, value: 'rect' })

      await userEvent.click(screen.getByRole('radio', { name: 'Rectangle' }))

      expect(onItemClick).toHaveBeenCalledTimes(1)
      expect(onItemClick).toHaveBeenCalledWith('rect')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not break when onItemClick is not provided', async () => {
      const onChange = vi.fn()
      renderPalette({ onChange, value: 'rect' })

      await userEvent.click(screen.getByRole('radio', { name: 'Ellipse' }))

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('ellipse')
    })
  })
})
