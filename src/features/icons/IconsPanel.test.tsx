import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { describe, expect, it } from 'vitest'

import { iconListAtom, projectAtom } from '@/store/atoms/project'
import { makeIcon, makeProject } from '@/test/fixtures/shapes'

import { IconsPanel } from './IconsPanel'

function renderPanel(icons?: ReturnType<typeof makeIcon>[]) {
  const store = createStore()
  if (icons) store.set(projectAtom, makeProject(icons))
  render(
    <Provider store={store}>
      <IconsPanel />
    </Provider>,
  )
  return store
}

describe('IconsPanel', () => {
  it('renders the Icons heading', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'Icons' })).toBeInTheDocument()
  })

  it('lists all icons', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Logo' })
    const iconB = makeIcon([], { id: 'b', name: 'Favicon' })
    renderPanel([iconA, iconB])

    expect(screen.getByText('Logo')).toBeInTheDocument()
    expect(screen.getByText('Favicon')).toBeInTheDocument()
  })

  it('has an add icon button', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'Add icon' })).toBeInTheDocument()
  })

  it('clicking the add button creates a new icon', async () => {
    const user = userEvent.setup()
    const store = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Add icon' }))

    const list = store.get(iconListAtom)
    expect(list).toHaveLength(2)
    expect(list[1].name).toBe('Icon 2')
  })

  it('new icon becomes active after add', async () => {
    const user = userEvent.setup()
    const store = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Add icon' }))

    const list = store.get(iconListAtom)
    expect(store.get(projectAtom).activeIconId).toBe(list[1].id)
  })
})
