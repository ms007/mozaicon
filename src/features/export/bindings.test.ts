import { createStore } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type ExportTarget, exportTargetAtom } from '@/store/atoms/export'
import { activeIconAtom } from '@/store/atoms/project'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import type { Icon } from '@/types/shapes'

import { createExportBindings } from './bindings'
import { performExport } from './performExport'

vi.mock('./performExport', () => ({
  performExport: vi.fn().mockResolvedValue(undefined),
}))

const docWithShapes = makeIcon([makeRect({ id: 's1', name: 'R1' })], { name: 'My Icon' })
const emptyDoc = makeIcon([], { name: 'Empty' })
const allHiddenDoc = makeIcon([makeRect({ id: 's1', name: 'R1', visible: false })], {
  name: 'Hidden',
})

function setup(doc: Icon = docWithShapes) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  const bindings = createExportBindings(store)
  const trigger = bindings.find((b) => b.id === 'export.trigger')
  if (!trigger) throw new Error('No export.trigger binding found')
  return { store, trigger }
}

describe('export.trigger binding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has mod+shift modifiers on E with bypassEditable', () => {
    const { trigger } = setup()
    expect(trigger.key).toBe('e')
    expect(trigger.modifiers).toEqual(['mod', 'shift'])
    expect(trigger.bypassEditable).toBe(true)
  })

  it.each(['svg', 'tsx', 'png2x'] as const satisfies readonly ExportTarget[])(
    're-triggers the sticky target %s',
    (target) => {
      const { store, trigger } = setup()
      store.set(exportTargetAtom, target)

      trigger.run()

      expect(performExport).toHaveBeenCalledOnce()
      expect(performExport).toHaveBeenCalledWith(docWithShapes, target)
    },
  )

  it('no-ops when there are no shapes', () => {
    const { trigger } = setup(emptyDoc)
    trigger.run()
    expect(performExport).not.toHaveBeenCalled()
  })

  it('no-ops when all shapes are hidden', () => {
    const { trigger } = setup(allHiddenDoc)
    trigger.run()
    expect(performExport).not.toHaveBeenCalled()
  })
})
