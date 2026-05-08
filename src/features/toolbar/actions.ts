import type { createStore } from 'jotai'

import { activeToolAtom } from '@/store/atoms/tool'

export function createToolbarActions(store: ReturnType<typeof createStore>) {
  return {
    handleChange: (value: string) => {
      store.set(activeToolAtom, value)
    },
  }
}
