import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { cornerRadiusStepDraftAtom } from '@/store/atoms/gestures/cornerRadiusStep'
import { propertyStepDraftAtom } from '@/store/atoms/gestures/propertyStep'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { undoCommand } from '@/store/commands/historyCommands'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Document } from '@/types/shapes'

import { PropertiesPanel } from './PropertiesPanel'

const testDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      type: 'rect',
      x: 2,
      y: 3,
      width: 10,
      height: 8,
    },
    {
      id: 'r2',
      name: 'Rect 2',
      visible: true,
      locked: false,
      type: 'rect',
      x: 2,
      y: 5,
      width: 10,
      height: 12,
    },
    {
      id: 'r3',
      name: 'Rect 3',
      visible: true,
      locked: false,
      type: 'rect',
      x: 7,
      y: 9,
      width: 4,
      height: 4,
    },
  ],
}

function renderPanel(doc: Document = testDoc, selectedIds: string[] = []) {
  return renderWithStore(<PropertiesPanel />, (store) => {
    store.set(documentAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

function field(label: string) {
  return screen.getByRole('textbox', { name: label })
}

describe('PropertiesPanel', () => {
  it('renders the Properties sidebar', () => {
    renderPanel()
    expect(screen.getByRole('complementary', { name: 'Properties' })).toBeInTheDocument()
  })

  it('shows Position and Layout section headers', () => {
    renderPanel()
    expect(screen.getByText('Position')).toBeInTheDocument()
    expect(screen.getByText('Layout')).toBeInTheDocument()
  })

  describe('empty selection', () => {
    it('shows disabled geometry fields with empty values (no appearance section)', () => {
      renderPanel()
      const fields = screen.getAllByRole('textbox')
      expect(fields).toHaveLength(4)
      for (const f of fields) {
        expect(f).toHaveValue('')
        expect(f).toBeDisabled()
      }
    })

    it('disables all field containers', () => {
      renderPanel()
      const containers = document.querySelectorAll('[data-slot="geometry-field"]')
      for (const c of containers) {
        expect(c).toHaveClass('opacity-50')
      }
    })
  })

  describe('single selection', () => {
    it('shows the selected shape x, y, width, height values', () => {
      renderPanel(testDoc, ['r1'])
      expect(field('X')).toHaveValue('2')
      expect(field('Y')).toHaveValue('3')
      expect(field('W')).toHaveValue('10')
      expect(field('H')).toHaveValue('8')
    })

    it('displays zero values as "0" not empty', () => {
      const zeroDoc: Document = {
        id: 'doc-zero',
        name: 'Zero',
        viewBox: [0, 0, 24, 24],
        shapes: [
          {
            id: 'z1',
            name: 'Zero Rect',
            visible: true,
            locked: false,
            type: 'rect',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
        ],
      }
      renderPanel(zeroDoc, ['z1'])
      expect(field('X')).toHaveValue('0')
      expect(field('Y')).toHaveValue('0')
      expect(field('W')).toHaveValue('0')
      expect(field('H')).toHaveValue('0')
    })

    it('shows values faithfully without rounding', () => {
      const preciseDoc: Document = {
        id: 'doc-precise',
        name: 'Precise',
        viewBox: [0, 0, 24, 24],
        shapes: [
          {
            id: 'p1',
            name: 'Precise Rect',
            visible: true,
            locked: false,
            type: 'rect',
            x: 1.123456789,
            y: 0.000001,
            width: 3.14159,
            height: 2.71828,
          },
        ],
      }
      renderPanel(preciseDoc, ['p1'])
      expect(field('X')).toHaveValue('1.123456789')
      expect(field('Y')).toHaveValue('0.000001')
      expect(field('W')).toHaveValue('3.14159')
      expect(field('H')).toHaveValue('2.71828')
    })
  })

  describe('multi-selection', () => {
    it('shows shared value when all selected shapes agree on a field', () => {
      renderPanel(testDoc, ['r1', 'r2'])
      expect(field('X')).toHaveValue('2')
      expect(field('W')).toHaveValue('10')
    })

    it('shows "Mixed" placeholder when selected shapes disagree on a field', () => {
      renderPanel(testDoc, ['r1', 'r2'])
      expect(field('Y')).toHaveValue('')
      expect(field('Y')).toHaveAttribute('placeholder', 'Mixed')
      expect(field('H')).toHaveValue('')
      expect(field('H')).toHaveAttribute('placeholder', 'Mixed')
    })

    it('shows all "Mixed" when no fields agree across three shapes', () => {
      renderPanel(testDoc, ['r1', 'r2', 'r3'])
      for (const label of ['X', 'Y', 'W', 'H']) {
        expect(field(label)).toHaveValue('')
        expect(field(label)).toHaveAttribute('placeholder', 'Mixed')
      }
    })
  })

  it('panel remains visible and does not jump between empty and single selection', () => {
    const { store } = renderPanel(testDoc)
    const panel = screen.getByRole('complementary', { name: 'Properties' })
    expect(panel).toBeInTheDocument()

    act(() => {
      store.set(selectShapesCommand, ['r1'])
    })
    expect(panel).toBeInTheDocument()
    expect(field('X')).toHaveValue('2')
  })

  describe('commit editing', () => {
    it('sets property on Enter', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '100')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ x: 100 })
    })

    it('sets property on blur', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Y'))
      await userEvent.type(field('Y'), '50')
      await userEvent.tab()

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ y: 50 })
    })

    it('does not alter the shape while typing (before commit)', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '99')

      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('unifies a mixed field across all selected shapes on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1', 'r2'])

      await userEvent.type(field('Y'), '20')
      await userEvent.keyboard('{Enter}')

      const shapes = store.get(documentAtom).shapes
      expect(shapes[0]).toMatchObject({ id: 'r1', y: 20 })
      expect(shapes[1]).toMatchObject({ id: 'r2', y: 20 })
    })

    it('sets a shared field on all selected shapes on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1', 'r2'])

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '15')
      await userEvent.keyboard('{Enter}')

      const shapes = store.get(documentAtom).shapes
      expect(shapes[0]).toMatchObject({ id: 'r1', x: 15 })
      expect(shapes[1]).toMatchObject({ id: 'r2', x: 15 })
    })

    it('clamps width to non-negative on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('W'))
      await userEvent.type(field('W'), '-5')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ width: 0 })
      expect(field('W')).toHaveValue('0')
    })

    it('clamps height to non-negative on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('H'))
      await userEvent.type(field('H'), '-10')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ height: 0 })
    })

    it('accepts negative X values', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '-3')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ x: -3 })
    })

    it('accepts negative Y values', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Y'))
      await userEvent.type(field('Y'), '-7')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ y: -7 })
    })

    it('produces exactly one undo step per commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const stackBefore = store.get(undoStackAtom).length

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '50')
      await userEvent.keyboard('{Enter}')

      expect(store.get(undoStackAtom)).toHaveLength(stackBefore + 1)
    })

    it('reverts on Escape without committing', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '999')
      await userEvent.keyboard('{Escape}')

      expect(field('X')).toHaveValue('2')
      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('reverts on empty input commit (cleared field)', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]

      await userEvent.clear(field('X'))
      await userEvent.keyboard('{Enter}')

      expect(field('X')).toHaveValue('2')
      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('does not double-commit when Enter is followed by blur', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const stackBefore = store.get(undoStackAtom).length

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '50')
      await userEvent.keyboard('{Enter}')
      await userEvent.tab()

      expect(store.get(undoStackAtom)).toHaveLength(stackBefore + 1)
      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 50 })
    })

    it('reverts to value on invalid input commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), 'abc')
      await userEvent.keyboard('{Enter}')

      expect(field('X')).toHaveValue('2')
      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('is undoable via the undo command', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '50')
      await userEvent.keyboard('{Enter}')

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 50 })
      expect(store.get(canUndoAtom)).toBe(true)

      act(() => {
        store.set(undoCommand)
      })

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 2 })
    })
  })

  describe('arrow-step live preview', () => {
    it('nudges the value on ArrowUp', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowUp}')

      expect(field('X')).toHaveValue('3')
    })

    it('nudges the value on ArrowDown', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowDown}')

      expect(field('X')).toHaveValue('1')
    })

    it('sets a preview draft for live canvas update', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowUp}')

      const draft = store.get(propertyStepDraftAtom)
      expect(draft).toEqual({ r1: { x: 3, y: 3, width: 10, height: 8 } })
    })

    it('does not change the document during stepping', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]
      await userEvent.click(field('X'))

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')

      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('commits on Enter after stepping — single undo entry', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const stackBefore = store.get(undoStackAtom).length
      await userEvent.click(field('X'))

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{Enter}')

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 5 })
      expect(store.get(undoStackAtom)).toHaveLength(stackBefore + 1)
    })

    it('commits on blur after stepping — single undo entry', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const stackBefore = store.get(undoStackAtom).length
      await userEvent.click(field('X'))

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.tab()

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 4 })
      expect(store.get(undoStackAtom)).toHaveLength(stackBefore + 1)
    })

    it('clears the preview draft on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowUp}')
      expect(store.get(propertyStepDraftAtom)).not.toBeNull()

      await userEvent.keyboard('{Enter}')
      expect(store.get(propertyStepDraftAtom)).toBeNull()
    })

    it('reverts on Escape and clears preview', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]
      await userEvent.click(field('X'))

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{Escape}')

      expect(field('X')).toHaveValue('2')
      expect(store.get(documentAtom).shapes[0]).toBe(before)
      expect(store.get(propertyStepDraftAtom)).toBeNull()
    })

    it('uses Shift+Arrow for coarse stepping (×10)', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')

      expect(field('X')).toHaveValue('12')
    })

    it('uses Alt+Arrow for fine stepping (×0.1)', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')

      expect(field('X')).toHaveValue('2.1')
    })

    it('is a no-op on a mixed field', async () => {
      const { store } = renderPanel(testDoc, ['r1', 'r2'])
      const before = store.get(documentAtom)
      await userEvent.click(field('Y'))

      await userEvent.keyboard('{ArrowUp}')

      expect(field('Y')).toHaveValue('')
      expect(field('Y')).toHaveAttribute('placeholder', 'Mixed')
      expect(store.get(documentAtom)).toBe(before)
      expect(store.get(propertyStepDraftAtom)).toBeNull()
    })

    it('typed values do not set a preview draft', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      await userEvent.clear(field('X'))
      await userEvent.type(field('X'), '99')

      expect(store.get(propertyStepDraftAtom)).toBeNull()
    })

    it('clamps width to non-negative when stepping down', async () => {
      const zeroDoc: Document = {
        id: 'doc-zero',
        name: 'Zero',
        viewBox: [0, 0, 24, 24],
        shapes: [
          {
            id: 'z1',
            name: 'Zero Rect',
            visible: true,
            locked: false,
            type: 'rect',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
        ],
      }
      renderPanel(zeroDoc, ['z1'])
      await userEvent.click(field('W'))

      await userEvent.keyboard('{ArrowDown}')
      expect(field('W')).toHaveValue('0')

      await userEvent.keyboard('{ArrowDown}')
      expect(field('W')).toHaveValue('0')
    })

    it('is undoable after commit via the undo command', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      await userEvent.click(field('X'))

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{Enter}')

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 4 })

      act(() => {
        store.set(undoCommand)
      })

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 2 })
    })

    it('does not block undo/redo while stepping is active', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Y'))
      await userEvent.type(field('Y'), '20')
      await userEvent.keyboard('{Enter}')
      expect(store.get(documentAtom).shapes[0]).toMatchObject({ y: 20 })

      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowUp}')
      expect(store.get(propertyStepDraftAtom)).not.toBeNull()

      act(() => {
        store.set(undoCommand)
      })
      expect(store.get(documentAtom).shapes[0]).toMatchObject({ y: 3 })
    })

    it('applies stepping to all selected shapes (multi-selection)', async () => {
      const { store } = renderPanel(testDoc, ['r1', 'r2'])
      await userEvent.click(field('X'))
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{Enter}')

      const shapes = store.get(documentAtom).shapes
      expect(shapes[0]).toMatchObject({ id: 'r1', x: 3 })
      expect(shapes[1]).toMatchObject({ id: 'r2', x: 3 })
    })
  })

  describe('Appearance section', () => {
    it('renders when the selection contains a rect', () => {
      renderPanel(testDoc, ['r1'])
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(field('Corner Radius')).toBeInTheDocument()
    })

    it('is hidden when nothing is selected', () => {
      renderPanel()
      expect(screen.queryByText('Appearance')).not.toBeInTheDocument()
    })

    it('shows 5 textboxes with a rect selected (4 geometry + 1 radius)', () => {
      renderPanel(testDoc, ['r1'])
      const fields = screen.getAllByRole('textbox')
      expect(fields).toHaveLength(5)
    })

    it('shows uniform radius value of 0 for a rect with no corner radius', () => {
      renderPanel(testDoc, ['r1'])
      expect(field('Corner Radius')).toHaveValue('0')
    })

    it('shows the rx value for a rect with uniform radius', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], rx: 4 }],
      }
      renderPanel(doc, ['r1'])
      expect(field('Corner Radius')).toHaveValue('4')
    })

    it('typing a value into the uniform field sets all corners as a single undo step', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const stackBefore = store.get(undoStackAtom).length

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '3')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ rx: 3 })
      expect(store.get(undoStackAtom)).toHaveLength(stackBefore + 1)
    })

    it('sets uniform radius on all selected rects', async () => {
      const { store } = renderPanel(testDoc, ['r1', 'r2'])

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '3')
      await userEvent.keyboard('{Enter}')

      const shapes = store.get(documentAtom).shapes
      expect(shapes[0]).toMatchObject({ id: 'r1', rx: 3 })
      expect(shapes[1]).toMatchObject({ id: 'r2', rx: 3 })
    })

    it('shows "Mixed" when corners differ within a rect', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], radii: [1, 2, 3, 4] }],
      }
      renderPanel(doc, ['r1'])
      expect(field('Corner Radius')).toHaveValue('')
      expect(field('Corner Radius')).toHaveAttribute('placeholder', 'Mixed')
    })

    it('shows "Mixed" when selected rects have different radii', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          { ...testDoc.shapes[0], rx: 2 },
          { ...testDoc.shapes[1], rx: 5 },
          testDoc.shapes[2],
        ],
      }
      renderPanel(doc, ['r1', 'r2'])
      expect(field('Corner Radius')).toHaveValue('')
      expect(field('Corner Radius')).toHaveAttribute('placeholder', 'Mixed')
    })

    it('typing into a Mixed uniform field sets all four corners', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], radii: [1, 2, 3, 4] }],
      }
      const { store } = renderPanel(doc, ['r1'])

      await userEvent.type(field('Corner Radius'), '4')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ rx: 4 })
      expect(shape).not.toHaveProperty('radii')
    })

    it('expand toggle reveals 4 per-corner inputs', async () => {
      renderPanel(testDoc, ['r1'])
      expect(screen.queryByRole('textbox', { name: 'Top Left' })).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Expand corner radius' }))

      expect(field('Top Left')).toBeInTheDocument()
      expect(field('Top Right')).toBeInTheDocument()
      expect(field('Bottom Right')).toBeInTheDocument()
      expect(field('Bottom Left')).toBeInTheDocument()
    })

    it('collapse toggle returns to single uniform input', async () => {
      renderPanel(testDoc, ['r1'])

      await userEvent.click(screen.getByRole('button', { name: 'Expand corner radius' }))
      expect(screen.queryByRole('textbox', { name: 'Corner Radius' })).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Collapse corner radius' }))
      expect(field('Corner Radius')).toBeInTheDocument()
    })

    it('editing one corner updates only that corner', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.click(screen.getByRole('button', { name: 'Expand corner radius' }))

      await userEvent.clear(field('Top Left'))
      await userEvent.type(field('Top Left'), '3')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ radii: [3, 0, 0, 0] })
    })

    it('per-corner fields show correct values for non-uniform radii', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], radii: [1, 2, 3, 4] }],
      }
      renderPanel(doc, ['r1'])

      await userEvent.click(screen.getByRole('button', { name: 'Expand corner radius' }))

      expect(field('Top Left')).toHaveValue('1')
      expect(field('Top Right')).toHaveValue('2')
      expect(field('Bottom Right')).toHaveValue('3')
      expect(field('Bottom Left')).toHaveValue('4')
    })

    it('clamps radius to non-negative on commit', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '-5')
      await userEvent.keyboard('{Enter}')

      expect(field('Corner Radius')).toHaveValue('0')
      const shape = store.get(documentAtom).shapes[0]
      expect(shape.rx).toBeUndefined()
    })

    it('re-syncs the field to the command-clamped value after Enter (max = min(w,h)/2)', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '100')
      await userEvent.keyboard('{Enter}')

      expect(field('Corner Radius')).toHaveValue('4')
      expect(store.get(documentAtom).shapes[0]).toMatchObject({ rx: 4 })
    })

    it('reverts on Escape without committing', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      const before = store.get(documentAtom).shapes[0]

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '99')
      await userEvent.keyboard('{Escape}')

      expect(field('Corner Radius')).toHaveValue('0')
      expect(store.get(documentAtom).shapes[0]).toBe(before)
    })

    it('commits on blur', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '4')
      await userEvent.tab()

      const shape = store.get(documentAtom).shapes[0]
      expect(shape).toMatchObject({ rx: 4 })
    })

    it('is undoable via the undo command', async () => {
      const { store } = renderPanel(testDoc, ['r1'])

      await userEvent.clear(field('Corner Radius'))
      await userEvent.type(field('Corner Radius'), '4')
      await userEvent.keyboard('{Enter}')

      expect(store.get(documentAtom).shapes[0]).toMatchObject({ rx: 4 })
      expect(store.get(canUndoAtom)).toBe(true)

      act(() => {
        store.set(undoCommand)
      })

      expect(store.get(documentAtom).shapes[0].rx).toBeUndefined()
    })

    it('arrow-key steps the uniform radius with preview', async () => {
      const { store } = renderPanel(testDoc, ['r1'])
      await userEvent.click(field('Corner Radius'))
      await userEvent.keyboard('{ArrowUp}')

      expect(field('Corner Radius')).toHaveValue('1')
      const draft = store.get(cornerRadiusStepDraftAtom)
      expect(draft).toEqual({ r1: [1, 1, 1, 1] })
    })

    it('Shift+Arrow coarse-steps radius (×10)', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('Corner Radius'))
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')

      expect(field('Corner Radius')).toHaveValue('10')
    })

    it('Alt+Arrow fine-steps radius (×0.1)', async () => {
      renderPanel(testDoc, ['r1'])
      await userEvent.click(field('Corner Radius'))
      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')

      expect(field('Corner Radius')).toHaveValue('0.1')
    })
  })
})
