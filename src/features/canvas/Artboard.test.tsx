import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Artboard } from '@/features/canvas/Artboard'
import { documentAtom } from '@/store/atoms/document'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { moveDraftAtom } from '@/store/atoms/move-draft'
import { activeToolAtom } from '@/store/atoms/tool'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderWithStore } from '@/test/renderWithStore'

const seededDoc = makeDoc([makeRect({ id: 'r1', name: 'Rect 1' })])

function firePointer(el: Element, type: string, overrides: Record<string, unknown> = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    button: 0,
    buttons: 1,
    clientX: 100,
    clientY: 100,
    ...overrides,
  })
  el.dispatchEvent(event)
  return event
}

function getArtboardDiv(container: HTMLElement): HTMLDivElement {
  const el = container.querySelector<HTMLDivElement>('div.bg-card')
  if (!el) throw new Error('Artboard div not found')
  return el
}

function mockCapture(el: HTMLDivElement) {
  const setCapture = vi.fn()
  const releaseCapture = vi.fn()
  const hasCapture = vi.fn().mockReturnValue(true)
  el.setPointerCapture = setCapture
  el.releasePointerCapture = releaseCapture
  el.hasPointerCapture = hasCapture
  return { setCapture, releaseCapture, hasCapture }
}

describe('Artboard', () => {
  it('applies surface token classes', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const wrapper = getArtboardDiv(container)
    expect(wrapper).toHaveClass('bg-card', 'rounded-xl')
  })

  it('does not apply border or shadow classes', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const wrapper = getArtboardDiv(container)
    expect(wrapper.className).not.toMatch(/border/)
    expect(wrapper.className).not.toMatch(/shadow/)
  })

  it('renders CanvasStage as a child', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    expect(container.querySelector('svg[aria-label="Icon canvas"]')).not.toBeNull()
  })

  it('applies no tool cursor when no tool is active', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const wrapper = getArtboardDiv(container)
    expect(wrapper.classList.contains('cursor-crosshair')).toBe(false)
  })

  it('applies crosshair cursor when a draw tool is active', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
      store.set(activeToolAtom, 'rect')
    })

    const wrapper = getArtboardDiv(container)
    expect(wrapper.classList.contains('cursor-crosshair')).toBe(true)
  })

  it('keeps the default cursor during a move', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
      store.set(moveDraftAtom, { ids: ['r1'], dx: 1, dy: 2 })
    })

    expect(getArtboardDiv(container)).not.toHaveClass('cursor-move')
  })

  it('keeps the tool cursorClass during a move', () => {
    const { container } = renderWithStore(<Artboard />, (store) => {
      store.set(documentAtom, seededDoc)
      store.set(activeToolAtom, 'rect')
      store.set(moveDraftAtom, { ids: ['r1'], dx: 0, dy: 0 })
    })

    const wrapper = getArtboardDiv(container)
    expect(wrapper).toHaveClass('cursor-crosshair')
    expect(wrapper).not.toHaveClass('cursor-move')
  })

  it('pointerdown in padding arms marquee when no tool is active', () => {
    const { container, store } = renderWithStore(<Artboard />, (s) => {
      s.set(documentAtom, seededDoc)
    })

    const wrapper = getArtboardDiv(container)
    const { setCapture } = mockCapture(wrapper)

    act(() => {
      firePointer(wrapper, 'pointerdown', { clientX: 10, clientY: 10 })
    })

    expect(store.get(marqueeDraftAtom)).not.toBeNull()
    expect(setCapture).toHaveBeenCalledWith(1)
  })

  it('pointerdown in padding takes capture when draw tool is active', () => {
    const { container } = renderWithStore(<Artboard />, (s) => {
      s.set(documentAtom, seededDoc)
      s.set(activeToolAtom, 'rect')
    })

    const wrapper = getArtboardDiv(container)
    const { setCapture } = mockCapture(wrapper)

    act(() => {
      firePointer(wrapper, 'pointerdown', { clientX: 10, clientY: 10 })
    })

    expect(setCapture).toHaveBeenCalledWith(1)
  })

  it('pointerdown on a shape does not reach the Artboard handler', () => {
    const { container } = renderWithStore(<Artboard />, (s) => {
      s.set(documentAtom, seededDoc)
    })

    const wrapper = getArtboardDiv(container)
    const { setCapture } = mockCapture(wrapper)

    const shapeEl = container.querySelector('rect[fill="#000"]')
    if (!shapeEl) throw new Error('Shape element not found')

    act(() => {
      firePointer(shapeEl, 'pointerdown', { clientX: 10, clientY: 10 })
    })

    expect(setCapture).not.toHaveBeenCalled()
  })
})
