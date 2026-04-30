import type { createStore } from 'jotai'

import { activeToolAtom } from '@/store/atoms/tool'
import { type AddRectPayload, addShapeCommand } from '@/store/commands/addShape'

export const DEFAULT_RECT: AddRectPayload = {
  x: 4,
  y: 4,
  width: 16,
  height: 16,
  fill: '#000',
}

export function createToolbarActions(store: ReturnType<typeof createStore>) {
  return {
    handleChange: (value: string) => {
      store.set(activeToolAtom, value)
    },
    handleItemClick: (value: string) => {
      if (value === 'rect') {
        store.set(addShapeCommand, DEFAULT_RECT)
      }
    },
  }
}
