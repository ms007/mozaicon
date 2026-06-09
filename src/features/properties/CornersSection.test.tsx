import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Corners, Document } from '@/types/shapes'

import { CornersSection } from './CornersSection'

function corners(overrides: Partial<Corners> = {}): Corners {
  return { ...DEFAULT_CORNERS, ...overrides }
}

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
      corners: corners({ radii: [4, 4, 4, 4] }),
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
      corners: corners({ radii: [4, 4, 4, 4] }),
    },
  ],
}

function renderSection(doc: Document = testDoc, selectedIds: string[] = []) {
  return renderWithStore(<CornersSection />, (store) => {
    store.set(documentAtom, doc)
    if (selectedIds.length > 0) {
      store.set(selectShapesCommand, selectedIds)
    }
  })
}

function segmented() {
  return screen.queryByRole('group', { name: 'Corner style' })
}

function segmentedOption(name: string) {
  return screen.getByRole('radio', { name })
}

describe('CornersSection', () => {
  it('renders the Corners section when a rect is selected', () => {
    renderSection(testDoc, ['r1'])
    expect(screen.getByText('Corners')).toBeInTheDocument()
  })

  it('is hidden when nothing is selected', () => {
    renderSection()
    expect(screen.queryByText('Corners')).not.toBeInTheDocument()
  })

  describe('radius-gating', () => {
    it('hides the segmented control when all radii are 0', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], corners: DEFAULT_CORNERS }],
      }
      renderSection(doc, ['r1'])
      expect(segmented()).not.toBeInTheDocument()
    })

    it('shows the segmented control when at least one radius > 0', () => {
      renderSection(testDoc, ['r1'])
      expect(segmented()).toBeInTheDocument()
    })

    it('shows the segmented control when radii are MIXED across selection', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          { ...testDoc.shapes[0], corners: corners({ radii: [4, 4, 4, 4] }) },
          { ...testDoc.shapes[1], corners: DEFAULT_CORNERS },
        ],
      }
      renderSection(doc, ['r1', 'r2'])
      expect(segmented()).toBeInTheDocument()
    })
  })

  describe('segmented control', () => {
    it('defaults to Rounded when corner style is rounded', () => {
      renderSection(testDoc, ['r1'])
      expect(segmentedOption('Rounded')).toHaveAttribute('data-state', 'on')
      expect(segmentedOption('Smooth')).toHaveAttribute('data-state', 'off')
    })

    it('switches to Smooth and dispatches the corner style command', async () => {
      const { store } = renderSection(testDoc, ['r1'])

      await userEvent.click(segmentedOption('Smooth'))

      const shape = store.get(documentAtom).shapes[0]
      expect(shape.corners.style).toBe('smooth')
    })

    it('switches back to Rounded', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 50 }),
          },
        ],
      }
      const { store } = renderSection(doc, ['r1'])

      await userEvent.click(segmentedOption('Rounded'))

      const shape = store.get(documentAtom).shapes[0]
      expect(shape.corners.style).toBe('rounded')
    })

    it('shows MIXED text when selected rects disagree on corner style', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          { ...testDoc.shapes[0], corners: corners({ radii: [4, 4, 4, 4], style: 'rounded' }) },
          { ...testDoc.shapes[1], corners: corners({ radii: [4, 4, 4, 4], style: 'smooth' }) },
        ],
      }
      renderSection(doc, ['r1', 'r2'])
      expect(screen.getByText('Mixed')).toBeInTheDocument()
    })

    it('has no active pill when style is MIXED', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          { ...testDoc.shapes[0], corners: corners({ radii: [4, 4, 4, 4], style: 'rounded' }) },
          { ...testDoc.shapes[1], corners: corners({ radii: [4, 4, 4, 4], style: 'smooth' }) },
        ],
      }
      renderSection(doc, ['r1', 'r2'])
      expect(segmentedOption('Rounded')).toHaveAttribute('data-state', 'off')
      expect(segmentedOption('Smooth')).toHaveAttribute('data-state', 'off')
    })
  })

  describe('smoothing controls', () => {
    it('shows slider and percent field when style is smooth and radius > 0', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 50 }),
          },
        ],
      }
      renderSection(doc, ['r1'])
      expect(screen.getByRole('slider')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Smoothing' })).toBeInTheDocument()
    })

    it('hides smoothing controls when style is rounded', () => {
      renderSection(testDoc, ['r1'])
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('hides smoothing controls when radius is 0', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [{ ...testDoc.shapes[0], corners: corners({ style: 'smooth', smoothing: 50 }) }],
      }
      renderSection(doc, ['r1'])
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('dispatches smoothing value from the text field on Enter', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 0 }),
          },
        ],
      }
      const { store } = renderSection(doc, ['r1'])
      const input = screen.getByRole('textbox', { name: 'Smoothing' })

      await userEvent.clear(input)
      await userEvent.type(input, '75')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape.corners.smoothing).toBe(75)
    })

    it('clamps smoothing to 0-100 on commit', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 0 }),
          },
        ],
      }
      const { store } = renderSection(doc, ['r1'])
      const input = screen.getByRole('textbox', { name: 'Smoothing' })

      await userEvent.clear(input)
      await userEvent.type(input, '200')
      await userEvent.keyboard('{Enter}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape.corners.smoothing).toBe(100)
    })

    it('shows MIXED placeholder when smoothing differs across selection', () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 30 }),
          },
          {
            ...testDoc.shapes[1],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 70 }),
          },
        ],
      }
      renderSection(doc, ['r1', 'r2'])
      const input = screen.getByRole('textbox', { name: 'Smoothing' })
      expect(input).toHaveValue('')
      expect(input).toHaveAttribute('placeholder', 'Mixed')
    })

    it('dispatches smoothing via slider', async () => {
      const doc: Document = {
        ...testDoc,
        shapes: [
          {
            ...testDoc.shapes[0],
            corners: corners({ radii: [4, 4, 4, 4], style: 'smooth', smoothing: 0 }),
          },
        ],
      }
      const { store } = renderSection(doc, ['r1'])
      const slider = screen.getByRole('slider')

      act(() => {
        slider.focus()
      })
      await userEvent.keyboard('{ArrowRight}')

      const shape = store.get(documentAtom).shapes[0]
      expect(shape.corners.smoothing).toBeGreaterThan(0)
    })
  })
})
