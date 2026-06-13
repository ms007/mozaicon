import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EditableLabel } from './EditableLabel'

describe('EditableLabel', () => {
  it('renders the name as static text', () => {
    render(<EditableLabel name="Layer 1" onRename={() => undefined} />)
    expect(screen.getByText('Layer 1')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('double-click enters edit mode with a focused, fully-selected input', async () => {
    const user = userEvent.setup()
    const onEditingChange = vi.fn()
    render(
      <EditableLabel name="Layer 1" onRename={() => undefined} onEditingChange={onEditingChange} />,
    )

    await user.dblClick(screen.getByText('Layer 1'))

    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('Layer 1')
    expect((input as HTMLInputElement).selectionStart).toBe(0)
    expect((input as HTMLInputElement).selectionEnd).toBe('Layer 1'.length)
    expect(onEditingChange).toHaveBeenCalledWith(true)
  })

  it('Enter commits the trimmed value and leaves edit mode', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    const onEditingChange = vi.fn()
    render(<EditableLabel name="Old" onRename={onRename} onEditingChange={onEditingChange} />)

    await user.dblClick(screen.getByText('Old'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '  New Name  {Enter}')

    expect(onRename).toHaveBeenCalledExactlyOnceWith('New Name')
    expect(onEditingChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('blur commits the rename', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<EditableLabel name="Old" onRename={onRename} />)

    await user.dblClick(screen.getByText('Old'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Renamed')
    await user.tab()

    expect(onRename).toHaveBeenCalledExactlyOnceWith('Renamed')
  })

  it('Escape reverts without calling onRename', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<EditableLabel name="Original" onRename={onRename} />)

    await user.dblClick(screen.getByText('Original'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Changed{Escape}')

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Original')).toBeInTheDocument()
  })

  it('does not call onRename for a whitespace-only value', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<EditableLabel name="Keep" onRename={onRename} />)

    await user.dblClick(screen.getByText('Keep'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '   {Enter}')

    expect(onRename).not.toHaveBeenCalled()
  })

  it('does not call onRename when the value is unchanged', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<EditableLabel name="Same" onRename={onRename} />)

    await user.dblClick(screen.getByText('Same'))
    await user.type(screen.getByRole('textbox'), '{Enter}')

    expect(onRename).not.toHaveBeenCalled()
  })
})
