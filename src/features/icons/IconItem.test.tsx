import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { describe, expect, it } from 'vitest'

import { undoStackAtom } from '@/store/atoms/history'
import { iconListAtom, projectAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeIcon, makeProject, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'

import { IconItem } from './IconItem'

function iconItem() {
  const el = document.querySelector<HTMLDivElement>('[data-slot="icon-item"]')
  if (!el) throw new Error('IconItem element not found')
  return el
}

function renderItem(
  icon: { id: string; name: string },
  store: ReturnType<typeof createStore>,
  iconCount?: number,
) {
  const count = iconCount ?? store.get(projectAtom).icons.length
  return render(
    <Provider store={store}>
      <IconItem icon={icon} iconCount={count} />
    </Provider>,
  )
}

describe('IconItem', () => {
  it('renders the icon name', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Logo' })
    const iconB = makeIcon([], { id: 'b', name: 'Favicon' })
    const store = createStore()
    store.set(projectAtom, makeProject([iconA, iconB]))

    renderItem({ id: 'b', name: 'Favicon' }, store)

    expect(screen.getByText('Favicon')).toBeInTheDocument()
  })

  it('marks the active icon with aria-selected', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const store = createStore()
    store.set(projectAtom, makeProject([iconA]))

    renderItem({ id: 'a', name: 'A' }, store)

    expect(screen.getByRole('option', { name: 'A' })).toHaveAttribute('aria-selected', 'true')
  })

  it('clicking switches the active icon', async () => {
    const user = userEvent.setup()
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = createStore()
    store.set(projectAtom, makeProject([iconA, iconB]))

    renderItem({ id: 'b', name: 'B' }, store)

    await user.click(screen.getByRole('option', { name: 'B' }))

    expect(store.get(projectAtom).activeIconId).toBe('b')
  })

  it('switching clears the selection', async () => {
    const user = userEvent.setup()
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = createStore()
    store.set(projectAtom, makeProject([iconA, iconB]))
    seedSelection(store, ['s1'])

    renderItem({ id: 'b', name: 'B' }, store)

    await user.click(screen.getByRole('option', { name: 'B' }))

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  describe('inline rename', () => {
    it('double-clicking the name switches to edit mode with a focused, fully-selected input', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Logo' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Logo' }, store)

      expect(iconItem().dataset.editing).toBe('false')

      await user.dblClick(screen.getByText('Logo'))

      expect(iconItem().dataset.editing).toBe('true')
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
      expect(input).toHaveValue('Logo')
      expect((input as HTMLInputElement).selectionStart).toBe(0)
      expect((input as HTMLInputElement).selectionEnd).toBe('Logo'.length)
    })

    it('Enter commits the rename', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Old' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Old' }, store)

      await user.dblClick(screen.getByText('Old'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'New Name{Enter}')

      expect(iconItem().dataset.editing).toBe('false')
      expect(store.get(iconListAtom)[0].name).toBe('New Name')
      expect(store.get(undoStackAtom)).toHaveLength(1)
    })

    it('blur commits the rename', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Old' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Old' }, store)

      await user.dblClick(screen.getByText('Old'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Blurred')
      await user.tab()

      expect(store.get(iconListAtom)[0].name).toBe('Blurred')
    })

    it('Escape discards the edit and reverts to original name', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Original' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Original' }, store)

      await user.dblClick(screen.getByText('Original'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Nope{Escape}')

      expect(iconItem().dataset.editing).toBe('false')
      expect(store.get(iconListAtom)[0].name).toBe('Original')
      expect(store.get(undoStackAtom)).toHaveLength(0)
    })

    it('empty commit behaves like cancel', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Keep' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Keep' }, store)

      await user.dblClick(screen.getByText('Keep'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '{Enter}')

      expect(iconItem().dataset.editing).toBe('false')
      expect(store.get(iconListAtom)[0].name).toBe('Keep')
      expect(store.get(undoStackAtom)).toHaveLength(0)
    })

    it('whitespace-only commit behaves like cancel', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Keep' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Keep' }, store)

      await user.dblClick(screen.getByText('Keep'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '   {Enter}')

      expect(iconItem().dataset.editing).toBe('false')
      expect(store.get(iconListAtom)[0].name).toBe('Keep')
      expect(store.get(undoStackAtom)).toHaveLength(0)
    })

    it('committing the unchanged name does not push history', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Same' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Same' }, store)

      await user.dblClick(screen.getByText('Same'))
      const input = screen.getByRole('textbox')
      await user.type(input, '{Enter}')

      expect(iconItem().dataset.editing).toBe('false')
      expect(store.get(undoStackAtom)).toHaveLength(0)
    })

    it('clicking the row while editing commits the rename via blur', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'Old' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Old' }, store)

      await user.dblClick(screen.getByText('Old'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Committed')
      await user.click(iconItem())

      expect(store.get(iconListAtom)[0].name).toBe('Committed')
      expect(iconItem().dataset.editing).toBe('false')
    })
  })

  describe('delete button', () => {
    it('is hidden when only one icon exists', () => {
      const iconA = makeIcon([], { id: 'a', name: 'Solo' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA]))

      renderItem({ id: 'a', name: 'Solo' }, store, 1)

      expect(screen.queryByRole('button', { name: 'Delete icon' })).not.toBeInTheDocument()
    })

    it('is present when multiple icons exist', () => {
      const iconA = makeIcon([], { id: 'a', name: 'A' })
      const iconB = makeIcon([], { id: 'b', name: 'B' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA, iconB]))

      renderItem({ id: 'a', name: 'A' }, store, 2)

      expect(screen.getByRole('button', { name: 'Delete icon' })).toBeInTheDocument()
    })

    it('clicking it deletes the icon', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'A' })
      const iconB = makeIcon([], { id: 'b', name: 'B' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA, iconB]))

      renderItem({ id: 'b', name: 'B' }, store, 2)

      await user.click(screen.getByRole('button', { name: 'Delete icon' }))

      expect(store.get(iconListAtom)).toHaveLength(1)
      expect(store.get(iconListAtom)[0].id).toBe('a')
    })

    it('click does not also trigger a switch (stopPropagation)', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'A' })
      const iconB = makeIcon([], { id: 'b', name: 'B' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA, iconB]))

      renderItem({ id: 'b', name: 'B' }, store, 2)

      await user.click(screen.getByRole('button', { name: 'Delete icon' }))

      expect(store.get(undoStackAtom)).toHaveLength(1)
      expect(store.get(undoStackAtom)[0].label).toBe('Delete icon')
    })

    it('keyboard activation deletes the icon and does not switch', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'A' })
      const iconB = makeIcon([], { id: 'b', name: 'B' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA, iconB]))

      renderItem({ id: 'b', name: 'B' }, store, 2)

      screen.getByRole('button', { name: 'Delete icon' }).focus()
      await user.keyboard('{Enter}')

      expect(store.get(iconListAtom)).toHaveLength(1)
      expect(store.get(iconListAtom)[0].id).toBe('a')
      expect(store.get(projectAtom).activeIconId).toBe('a')
      expect(store.get(undoStackAtom)).toHaveLength(1)
      expect(store.get(undoStackAtom)[0].label).toBe('Delete icon')
    })

    it('is hidden while in edit mode', async () => {
      const user = userEvent.setup()
      const iconA = makeIcon([], { id: 'a', name: 'A' })
      const iconB = makeIcon([], { id: 'b', name: 'B' })
      const store = createStore()
      store.set(projectAtom, makeProject([iconA, iconB]))

      renderItem({ id: 'a', name: 'A' }, store, 2)

      expect(screen.getByRole('button', { name: 'Delete icon' })).toBeInTheDocument()

      await user.dblClick(screen.getByText('A'))

      expect(screen.queryByRole('button', { name: 'Delete icon' })).not.toBeInTheDocument()
    })
  })
})
