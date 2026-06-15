import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { activeIconAtom } from '@/store/atoms/project'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon, RectShape } from '@/types/shapes'

import { FillSection } from './FillSection'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 10,
  height: 8,
  fill: '#cccccc',
  corners: { radii: [0, 0, 0, 0], style: 'rounded', smoothing: 0 },
}

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect, { ...baseRect, id: 'r2', name: 'Rect 2' }],
}

function renderSection(doc: Icon = testDoc, selectedIds: string[] = []) {
  return renderWithStore(<FillSection />, (store) => {
    store.set(activeIconAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

describe('FillSection', () => {
  it('is hidden when nothing is selected', () => {
    renderSection()
    expect(screen.queryByText('Fill')).not.toBeInTheDocument()
  })

  it('renders the Fill section when a shape is selected', () => {
    renderSection(testDoc, ['r1'])
    expect(screen.getByText('Fill')).toBeInTheDocument()
  })

  it('shows remove button when all selected shapes have a fill', () => {
    renderSection(testDoc, ['r1'])
    expect(screen.getByRole('button', { name: 'Remove fill' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add fill' })).not.toBeInTheDocument()
  })

  it('shows add button when no selected shape has a fill', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    renderSection(doc, ['r1'])
    expect(screen.getByRole('button', { name: 'Add fill' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove fill' })).not.toBeInTheDocument()
  })

  it('shows remove button when some selected shapes have a fill', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [
        { ...baseRect, id: 'r1', fill: '#cccccc' },
        { ...baseRect, id: 'r2', fill: 'none' },
      ],
    }
    renderSection(doc, ['r1', 'r2'])
    expect(screen.getByRole('button', { name: 'Remove fill' })).toBeInTheDocument()
  })

  it('dispatches addFill when clicking add button', async () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    const { store } = renderSection(doc, ['r1'])

    await userEvent.click(screen.getByRole('button', { name: 'Add fill' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#000000')
  })

  it('uses the first filled swatch color when adding a fill', async () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    const { store } = renderWithStore(<FillSection />, (s) => {
      s.set(activeIconAtom, doc)
      s.set(selectShapesCommand, ['r1'])
      s.set(colorSlotsAtom, [null, '#ff0000', null, null, null, null, null, null, null, null])
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add fill' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#ff0000')
  })

  it('dispatches removeFill when clicking remove button', async () => {
    const { store } = renderSection(testDoc, ['r1'])

    await userEvent.click(screen.getByRole('button', { name: 'Remove fill' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('none')
  })

  it('renders the colour trigger in a full-width PropertyRow', () => {
    const { container } = renderSection(testDoc, ['r1'])
    const propertyRows = container.querySelectorAll('[data-slot="property-row"]')
    expect(propertyRows).toHaveLength(1)

    const row = propertyRows[0]
    expect(row.querySelector('[data-slot="fill-color-trigger"]')).toBeInTheDocument()
  })

  it('hides color control when fill is removed', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    const { container } = renderSection(doc, ['r1'])
    expect(container.querySelector('[data-slot="fill-color-trigger"]')).not.toBeInTheDocument()
  })

  it('shows MIXED placeholder when fills disagree', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [
        { ...baseRect, id: 'r1', fill: '#ff0000' },
        { ...baseRect, id: 'r2', fill: '#00ff00' },
      ],
    }
    renderSection(doc, ['r1', 'r2'])
    expect(screen.getByPlaceholderText('Mixed')).toBeInTheDocument()
  })
})
