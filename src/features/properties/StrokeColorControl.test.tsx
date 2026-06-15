import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { paintPreviewDraftAtom } from '@/store/atoms/gestures/paintPreview'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon, RectShape } from '@/types/shapes'

import { StrokeColorControl } from './StrokeColorControl'

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

function renderControl(doc: Icon = strokedDoc, selectedIds: string[] = ['r1']) {
  return renderWithStore(<StrokeColorControl />, (store) => {
    store.set(activeIconAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

function trigger() {
  return screen.getByLabelText('Stroke color')
}

async function openPicker() {
  await userEvent.click(trigger())
}

describe('StrokeColorControl', () => {
  it('renders a stroke color trigger reflecting the current stroke', () => {
    renderControl()
    expect(trigger()).toHaveStyle({ backgroundColor: '#000000' })
  })

  it('keeps the picker closed until the trigger is clicked', async () => {
    renderControl()
    expect(screen.queryByLabelText('Hex color')).not.toBeInTheDocument()

    await openPicker()
    expect(screen.getByLabelText('Hex color')).toBeInTheDocument()
  })

  it('shows 10 color slots inside the open picker', async () => {
    renderControl()
    await openPicker()

    const container = screen.getByText((_content, element) => {
      return element?.getAttribute('data-slot') === 'color-slots'
    })
    expect(container.querySelectorAll('[data-slot="color-slot"]')).toHaveLength(10)
  })

  it('first slot is filled with #000000, the rest empty by default', async () => {
    renderControl()
    await openPicker()

    expect(screen.getByLabelText('Color slot 1: #000000')).toBeInTheDocument()
    for (let i = 2; i <= 10; i++) {
      expect(screen.getByLabelText(`Color slot ${String(i)} (empty)`)).toBeInTheDocument()
    }
  })

  it('selects the slot matching the current stroke color on open', async () => {
    renderControl()
    await openPicker()

    expect(screen.getByLabelText('Color slot 1: #000000')).toHaveAttribute('data-active', 'true')
  })

  it('selects no slot when the stroke color is not stored in any slot', async () => {
    const doc: Icon = {
      ...strokedDoc,
      shapes: [{ ...baseRect, stroke: '#abcdef', strokeWidth: 2 }],
    }
    renderControl(doc)
    await openPicker()

    for (const swatch of screen.getAllByRole('button')) {
      if (swatch.getAttribute('data-slot') === 'swatch') {
        expect(swatch).toHaveAttribute('data-active', 'false')
      }
    }
  })

  it('loads a clicked slot color into the picker as a live preview', async () => {
    const { store } = renderWithStore(<StrokeColorControl />, (s) => {
      s.set(activeIconAtom, strokedDoc)
      s.set(selectShapesCommand, ['r1'])
      s.set(colorSlotsAtom, ['#000000', '#ff0000', null, null, null, null, null, null, null, null])
    })

    await openPicker()
    await userEvent.click(screen.getByLabelText('Color slot 2: #ff0000'))

    expect(store.get(paintPreviewDraftAtom)?.r1.stroke).toBe('#ff0000')
    expect(screen.getByLabelText('Color slot 2: #ff0000')).toHaveAttribute('data-active', 'true')
    expect(screen.getByLabelText('Hex color')).toHaveValue('ff0000')
  })

  it('writes picker edits to the preview draft, not to commands', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()

    expect(store.get(paintPreviewDraftAtom)).not.toBeNull()
    expect(store.get(undoStackAtom)).toHaveLength(baseline)
  })

  it('persists picker edits into the selected slot (palette remembers)', async () => {
    const { store } = renderControl()

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')

    expect(store.get(colorSlotsAtom)[0]).toBe('#ff5500')
  })

  it('stores the working color into a clicked empty slot', async () => {
    const { store } = renderControl()

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, '112233{Enter}')

    await userEvent.click(screen.getByLabelText('Color slot 2 (empty)'))

    expect(store.get(colorSlotsAtom)[1]).toBe('#112233')
  })

  it('commits the working color and closes when the close button is clicked', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')

    await userEvent.click(screen.getByLabelText('Close color picker'))

    expect(screen.queryByLabelText('Hex color')).not.toBeInTheDocument()
    expect(store.get(activeIconAtom).shapes[0].stroke).toBe('#ff5500')
    expect(store.get(undoStackAtom)).toHaveLength(baseline + 1)
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('Escape reverts the preview and closes without committing', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()
    expect(store.get(paintPreviewDraftAtom)).not.toBeNull()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByLabelText('Hex color')).not.toBeInTheDocument()
    expect(store.get(paintPreviewDraftAtom)).toBeNull()
    expect(store.get(undoStackAtom)).toHaveLength(baseline)
  })

  it('a full picker visit produces exactly one undo step', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')
    await userEvent.click(screen.getByLabelText('Close color picker'))

    expect(store.get(undoStackAtom)).toHaveLength(baseline + 1)
    expect(store.get(activeIconAtom).shapes[0].stroke).toBe('#ff5500')
  })
})
