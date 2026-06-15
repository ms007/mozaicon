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

import { FillColorControl } from './FillColorControl'

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

const filledDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [{ ...baseRect, fill: '#000000' }],
}

function renderControl(doc: Icon = filledDoc, selectedIds: string[] = ['r1']) {
  return renderWithStore(<FillColorControl />, (store) => {
    store.set(activeIconAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

function trigger() {
  return screen.getByLabelText('Fill color')
}

async function openPicker() {
  await userEvent.click(trigger())
}

describe('FillColorControl', () => {
  it('renders a fill color trigger reflecting the current fill', () => {
    renderControl()
    expect(trigger()).toHaveStyle({ backgroundColor: '#000000' })
  })

  it('keeps the picker closed until the trigger is clicked', async () => {
    renderControl()
    expect(screen.queryByLabelText('Hex color')).not.toBeInTheDocument()

    await openPicker()
    expect(screen.getByLabelText('Hex color')).toBeInTheDocument()
  })

  it('writes picker edits to the preview draft, not to commands', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()

    expect(store.get(paintPreviewDraftAtom)?.r1.fill).toBeDefined()
    expect(store.get(undoStackAtom)).toHaveLength(baseline)
  })

  it('commits the working fill and closes when the close button is clicked', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')

    await userEvent.click(screen.getByLabelText('Close color picker'))

    expect(screen.queryByLabelText('Hex color')).not.toBeInTheDocument()
    expect(store.get(activeIconAtom).shapes[0].fill).toBe('#ff5500')
    expect(store.get(paintPreviewDraftAtom)).toBeNull()
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
    expect(store.get(activeIconAtom).shapes[0].fill).toBe('#000000')
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
    expect(store.get(activeIconAtom).shapes[0].fill).toBe('#ff5500')
  })

  it('commits a typed hex from the trigger field while the picker is closed', async () => {
    const { store } = renderControl()
    const baseline = store.get(undoStackAtom).length

    const field = screen.getByLabelText('Fill color hex')
    await userEvent.clear(field)
    await userEvent.type(field, '00ff00{Enter}')

    expect(store.get(activeIconAtom).shapes[0].fill).toBe('#00ff00')
    expect(store.get(undoStackAtom)).toHaveLength(baseline + 1)
  })

  it('persists picker edits into the selected slot (shared palette remembers)', async () => {
    const { store } = renderWithStore(<FillColorControl />, (s) => {
      s.set(activeIconAtom, filledDoc)
      s.set(selectShapesCommand, ['r1'])
      s.set(colorSlotsAtom, ['#000000', null, null, null, null, null, null, null, null, null])
    })

    await openPicker()
    const input = screen.getByLabelText('Hex color')
    await userEvent.clear(input)
    await userEvent.type(input, 'ff5500{Enter}')

    expect(store.get(colorSlotsAtom)[0]).toBe('#ff5500')
  })
})
