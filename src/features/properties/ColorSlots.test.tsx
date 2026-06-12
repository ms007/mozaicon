import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { strokeColorSlotsAtom } from '@/store/atoms/colorSlots'
import { strokePreviewDraftAtom } from '@/store/atoms/gestures/strokePreview'
import { canUndoAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon, RectShape } from '@/types/shapes'

import { ColorSlots } from './ColorSlots'

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

const strokedDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [{ ...baseRect, stroke: '#000000', strokeWidth: 2 }],
}

function renderSlots(doc: Icon = strokedDoc, selectedIds: string[] = ['r1']) {
  return renderWithStore(<ColorSlots />, (store) => {
    store.set(activeIconAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

describe('ColorSlots', () => {
  it('renders 8 color slots', () => {
    renderSlots()
    const container = screen.getByText((_content, element) => {
      return element?.getAttribute('data-slot') === 'color-slots'
    })
    const slots = container.querySelectorAll('[data-slot="color-slot"]')
    expect(slots).toHaveLength(8)
  })

  it('first slot is filled with #000000 by default', () => {
    renderSlots()
    const swatch = screen.getByLabelText('Color slot 1: #000000')
    expect(swatch).toBeInTheDocument()
  })

  it('remaining slots are empty by default', () => {
    renderSlots()
    for (let i = 2; i <= 8; i++) {
      expect(screen.getByLabelText(`Color slot ${String(i)} (empty)`)).toBeInTheDocument()
    }
  })

  it('marks slot as active when its color matches the selection stroke', () => {
    renderSlots()
    const swatch = screen.getByLabelText('Color slot 1: #000000')
    expect(swatch).toHaveAttribute('data-active', 'true')
  })

  it('no slot is active when selection stroke is mixed', () => {
    const doc: Icon = {
      ...strokedDoc,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#ff0000', strokeWidth: 2 },
        { ...baseRect, id: 'r2', stroke: '#00ff00', strokeWidth: 2 },
      ],
    }
    renderSlots(doc, ['r1', 'r2'])
    const swatches = screen.getAllByRole('button')
    for (const swatch of swatches) {
      if (swatch.getAttribute('data-slot') === 'swatch') {
        expect(swatch).toHaveAttribute('data-active', 'false')
      }
    }
  })

  it('no slot is active when selection color is not in any slot', () => {
    const doc: Icon = {
      ...strokedDoc,
      shapes: [{ ...baseRect, stroke: '#abcdef', strokeWidth: 2 }],
    }
    renderSlots(doc)
    const swatches = screen.getAllByRole('button')
    for (const swatch of swatches) {
      if (swatch.getAttribute('data-slot') === 'swatch') {
        expect(swatch).toHaveAttribute('data-active', 'false')
      }
    }
  })

  it('clicking a filled inactive slot applies its color', async () => {
    const doc: Icon = {
      ...strokedDoc,
      shapes: [{ ...baseRect, stroke: '#abcdef', strokeWidth: 2 }],
    }
    const { store } = renderSlots(doc)

    await userEvent.click(screen.getByLabelText('Color slot 1: #000000'))

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#000000')
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('slot state survives undo — shape reverts but slot keeps color', async () => {
    const { store } = renderWithStore(<ColorSlots />, (s) => {
      s.set(activeIconAtom, strokedDoc)
      s.set(selectShapesCommand, ['r1'])
      s.set(strokeColorSlotsAtom, ['#000000', '#ff0000', null, null, null, null, null, null])
    })

    await userEvent.click(screen.getByLabelText('Color slot 2: #ff0000'))

    expect(store.get(activeIconAtom).shapes[0].stroke).toBe('#ff0000')

    const slots = store.get(strokeColorSlotsAtom)
    expect(slots[1]).toBe('#ff0000')
  })

  it('does not write preview draft on a simple slot click (filled inactive)', async () => {
    const doc: Icon = {
      ...strokedDoc,
      shapes: [{ ...baseRect, stroke: '#abcdef', strokeWidth: 2 }],
    }
    const { store } = renderSlots(doc)

    await userEvent.click(screen.getByLabelText('Color slot 1: #000000'))

    expect(store.get(strokePreviewDraftAtom)).toBeNull()
  })
})
