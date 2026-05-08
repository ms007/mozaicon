import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderResult,
} from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import type { ReactElement, ReactNode } from 'react'

export type TestStore = ReturnType<typeof createStore>

export interface RenderWithStoreResult extends RenderResult {
  store: TestStore
}

export function renderWithStore(
  ui: ReactElement,
  seed?: (store: TestStore) => void,
): RenderWithStoreResult {
  const store = createStore()
  seed?.(store)
  const utils = render(<Provider store={store}>{ui}</Provider>)
  return { ...utils, store }
}

export type RenderHookWithStoreResult<Result, Props> = RenderHookResult<Result, Props> & {
  store: TestStore
}

export function renderHookWithStore<Result, Props = unknown>(
  hook: (props: Props) => Result,
  seed?: (store: TestStore) => void,
): RenderHookWithStoreResult<Result, Props> {
  const store = createStore()
  seed?.(store)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  const utils = renderHook(hook, { wrapper })
  return { ...utils, store }
}
