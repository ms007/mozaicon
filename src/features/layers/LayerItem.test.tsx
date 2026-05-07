import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LayerItem, type LayerItemProps } from './LayerItem'

const icon = <span data-testid="layer-icon">R</span>

function defaults(overrides: Partial<LayerItemProps> = {}): LayerItemProps {
  return {
    icon,
    name: 'Rectangle 1',
    visible: true,
    selected: false,
    onSelect: () => undefined,
    onToggleVisible: () => undefined,
    onRename: () => undefined,
    ...overrides,
  }
}

function row() {
  const el = document.querySelector<HTMLDivElement>('[data-slot="layer-item"]')
  if (!el) throw new Error('LayerItem element not found')
  return el
}

describe('LayerItem', () => {
  describe('entering rename mode', () => {
    it('double-clicking the name switches to edit mode with a focused, fully-selected input', async () => {
      const user = userEvent.setup()
      render(<LayerItem {...defaults()} />)

      expect(row().dataset.editing).toBe('false')

      await user.dblClick(screen.getByText('Rectangle 1'))

      expect(row().dataset.editing).toBe('true')
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
      expect(input).toHaveValue('Rectangle 1')
      // The entire value should be selected
      expect((input as HTMLInputElement).selectionStart).toBe(0)
      expect((input as HTMLInputElement).selectionEnd).toBe('Rectangle 1'.length)
    })

    it('hides the Eye button while editing', async () => {
      const user = userEvent.setup()
      render(<LayerItem {...defaults()} />)

      await user.dblClick(screen.getByText('Rectangle 1'))

      expect(screen.queryByRole('button', { name: /visibility/i })).not.toBeInTheDocument()
    })
  })

  describe('commit and cancel paths', () => {
    it('Enter calls onRename with the new trimmed value', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Icon Background{Enter}')

      expect(onRename).toHaveBeenCalledTimes(1)
      expect(onRename).toHaveBeenCalledWith('Icon Background')
      expect(row().dataset.editing).toBe('false')
    })

    it('blur commits the rename', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'New Name')
      await user.tab()

      expect(onRename).toHaveBeenCalledTimes(1)
      expect(onRename).toHaveBeenCalledWith('New Name')
    })

    it('Esc does not call onRename and reverts to the original name', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Nope{Escape}')

      expect(onRename).not.toHaveBeenCalled()
      expect(row().dataset.editing).toBe('false')
      expect(screen.getByText('Rectangle 1')).toBeInTheDocument()
    })

    it('empty commit behaves like cancel', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '{Enter}')

      expect(onRename).not.toHaveBeenCalled()
      expect(row().dataset.editing).toBe('false')
    })

    it('whitespace-only commit behaves like cancel', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '   {Enter}')

      expect(onRename).not.toHaveBeenCalled()
      expect(row().dataset.editing).toBe('false')
    })

    it('committing the unchanged name does not call onRename', async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<LayerItem {...defaults({ onRename })} />)

      await user.dblClick(screen.getByText('Rectangle 1'))
      const input = screen.getByRole('textbox')
      await user.type(input, '{Enter}')

      expect(onRename).not.toHaveBeenCalled()
      expect(row().dataset.editing).toBe('false')
    })
  })

  describe('eye isolation', () => {
    it('clicking Eye fires onToggleVisible and does not fire onSelect', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const onToggleVisible = vi.fn()
      render(<LayerItem {...defaults({ onSelect, onToggleVisible, selected: false })} />)

      // Eye button should be available on hover; we query by role
      const eyeButton = screen.getByRole('button', { name: /visibility/i })
      await user.click(eyeButton)

      expect(onToggleVisible).toHaveBeenCalledTimes(1)
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('clicking the row fires onSelect', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<LayerItem {...defaults({ onSelect })} />)

      await user.click(row())

      expect(onSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('keyboard activation', () => {
    it('Enter on the row fires onSelect', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<LayerItem {...defaults({ onSelect })} />)

      row().focus()
      await user.keyboard('{Enter}')

      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('Space on the row fires onSelect', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<LayerItem {...defaults({ onSelect })} />)

      row().focus()
      await user.keyboard(' ')

      expect(onSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('data attributes', () => {
    it('reflects selected prop on data-selected', () => {
      const { rerender } = render(<LayerItem {...defaults({ selected: false })} />)
      expect(row().dataset.selected).toBe('false')

      rerender(<LayerItem {...defaults({ selected: true })} />)
      expect(row().dataset.selected).toBe('true')
    })

    it('reflects visible prop on data-visible', () => {
      const { rerender } = render(<LayerItem {...defaults({ visible: true })} />)
      expect(row().dataset.visible).toBe('true')

      rerender(<LayerItem {...defaults({ visible: false })} />)
      expect(row().dataset.visible).toBe('false')
    })
  })
})
