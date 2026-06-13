import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { strokeColorSlotsAtom } from '@/store/atoms/colorSlots'
import { activeIconAtom } from '@/store/atoms/project'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon, RectShape } from '@/types/shapes'

import { StrokeSection } from './StrokeSection'

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
  corners: { radii: [0, 0, 0, 0], style: 'rounded', smoothing: 0 },
}

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect, { ...baseRect, id: 'r2', name: 'Rect 2' }],
}

function renderSection(doc: Icon = testDoc, selectedIds: string[] = []) {
  return renderWithStore(<StrokeSection />, (store) => {
    store.set(activeIconAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

describe('StrokeSection', () => {
  it('is hidden when nothing is selected', () => {
    renderSection()
    expect(screen.queryByText('Stroke')).not.toBeInTheDocument()
  })

  it('renders the Stroke section when a shape is selected', () => {
    renderSection(testDoc, ['r1'])
    expect(screen.getByText('Stroke')).toBeInTheDocument()
  })

  it('shows add button when no selected shapes have a stroke', () => {
    renderSection(testDoc, ['r1'])
    expect(screen.getByRole('button', { name: 'Add stroke' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove stroke' })).not.toBeInTheDocument()
  })

  it('shows remove button when all selected shapes have a stroke', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, stroke: '#000', strokeWidth: 2 }],
    }
    renderSection(doc, ['r1'])
    expect(screen.getByRole('button', { name: 'Remove stroke' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add stroke' })).not.toBeInTheDocument()
  })

  it('shows remove button when some selected shapes have a stroke', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
        { ...baseRect, id: 'r2' },
      ],
    }
    renderSection(doc, ['r1', 'r2'])
    expect(screen.getByRole('button', { name: 'Remove stroke' })).toBeInTheDocument()
  })

  it('dispatches addStroke when clicking add button', async () => {
    const { store } = renderSection(testDoc, ['r1'])

    await userEvent.click(screen.getByRole('button', { name: 'Add stroke' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#000000')
    expect(shape.strokeWidth).toBe(2)
  })

  it('uses the first filled swatch color when re-adding a stroke', async () => {
    const { store } = renderWithStore(<StrokeSection />, (s) => {
      s.set(activeIconAtom, testDoc)
      s.set(selectShapesCommand, ['r1'])
      s.set(strokeColorSlotsAtom, [null, '#ff0000', null, null, null, null, null, null])
    })

    await userEvent.click(screen.getByRole('button', { name: 'Add stroke' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0000')
  })

  it('renders content rows through PropertyRow', () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, stroke: '#000', strokeWidth: 2 }],
    }
    const { container } = renderSection(doc, ['r1'])
    const propertyRows = container.querySelectorAll('[data-slot="property-row"]')
    expect(propertyRows.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the add/remove toggle on the gutter line', () => {
    renderSection(testDoc, ['r1'])
    const button = screen.getByRole('button', { name: 'Add stroke' })
    const gutterCell = button.closest('.col-start-2')
    expect(gutterCell).toBeInTheDocument()
  })

  it('dispatches removeStroke when clicking remove button', async () => {
    const doc: Icon = {
      ...testDoc,
      shapes: [{ ...baseRect, stroke: '#f00', strokeWidth: 3 }],
    }
    const { store } = renderSection(doc, ['r1'])

    await userEvent.click(screen.getByRole('button', { name: 'Remove stroke' }))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBeUndefined()
    expect(shape.strokeWidth).toBe(3)
  })
})
