import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { exportTargetAtom } from '@/store/atoms/export'
import { activeIconAtom } from '@/store/atoms/project'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon } from '@/types/shapes'

import { ExportSection } from './ExportSection'
import { performExport } from './performExport'

vi.mock('./performExport', () => ({
  performExport: vi.fn().mockResolvedValue(undefined),
}))

const docWithShapes = makeIcon([makeRect({ id: 's1', name: 'R1' })], { name: 'My Icon' })
const emptyDoc = makeIcon([], { name: 'Empty' })
const allHiddenDoc = makeIcon([makeRect({ id: 's1', name: 'R1', visible: false })], {
  name: 'Hidden',
})

function renderExport(doc: Icon = docWithShapes) {
  return renderWithStore(<ExportSection />, (store) => {
    store.set(activeIconAtom, doc)
  })
}

function btn(label: string) {
  return screen.getByRole('button', { name: `Export ${label}` })
}

describe('ExportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders five export buttons', () => {
    renderExport()
    expect(btn('SVG')).toBeInTheDocument()
    expect(btn('TSX')).toBeInTheDocument()
    expect(btn('1x')).toBeInTheDocument()
    expect(btn('2x')).toBeInTheDocument()
    expect(btn('4x')).toBeInTheDocument()
  })

  it('shows the Export section heading', () => {
    renderExport()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  describe('disabled state', () => {
    it('disables all buttons when there are no shapes', () => {
      renderExport(emptyDoc)
      for (const label of ['SVG', 'TSX', '1x', '2x', '4x']) {
        expect(btn(label)).toBeDisabled()
      }
    })

    it('disables all buttons when all shapes are hidden', () => {
      renderExport(allHiddenDoc)
      for (const label of ['SVG', 'TSX', '1x', '2x', '4x']) {
        expect(btn(label)).toBeDisabled()
      }
    })

    it('enables all buttons when shapes are visible', () => {
      renderExport()
      for (const label of ['SVG', 'TSX', '1x', '2x', '4x']) {
        expect(btn(label)).toBeEnabled()
      }
    })
  })

  describe('sticky target styling', () => {
    it('SVG button has primary variant by default', () => {
      renderExport()
      expect(btn('SVG')).toHaveAttribute('data-variant', 'primary')
    })

    it('disabled buttons do not get primary variant even if they are the sticky target', () => {
      renderExport(emptyDoc)
      expect(btn('SVG')).toHaveAttribute('data-variant', 'default')
    })

    it('shows primary variant on the last-clicked button', async () => {
      renderExport()
      await userEvent.click(btn('2x'))
      expect(btn('2x')).toHaveAttribute('data-variant', 'primary')
      expect(btn('SVG')).toHaveAttribute('data-variant', 'default')
    })
  })

  describe('dispatch', () => {
    it.each([
      ['SVG', 'svg'],
      ['TSX', 'tsx'],
      ['1x', 'png1x'],
      ['2x', 'png2x'],
      ['4x', 'png4x'],
    ] as const)('clicking %s sets the sticky target and dispatches %s', async (label, target) => {
      const { store } = renderExport()

      await userEvent.click(btn(label))

      expect(store.get(exportTargetAtom)).toBe(target)
      expect(performExport).toHaveBeenCalledOnce()
      expect(performExport).toHaveBeenCalledWith(docWithShapes, target)
    })
  })

  describe('reactivity', () => {
    it('re-enables buttons when a shape becomes visible', () => {
      const { store } = renderExport(emptyDoc)
      expect(btn('SVG')).toBeDisabled()

      act(() => {
        store.set(activeIconAtom, docWithShapes)
      })

      expect(btn('SVG')).toBeEnabled()
    })
  })
})
