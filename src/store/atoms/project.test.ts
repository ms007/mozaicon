import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom, projectAtom, shapesAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { addShapeCommand } from '@/store/commands/addShape'
import { createCommand } from '@/store/commands/createCommand'
import { redoCommand, undoCommand } from '@/store/commands/historyCommands'
import { moveSelectionCommand } from '@/store/commands/moveSelection'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'

function makeStore() {
  const store = createStore()
  return store
}

describe('Project schema', () => {
  it('projectAtom defaults to a single-icon project', () => {
    const store = makeStore()
    const project = store.get(projectAtom)

    expect(project.id).toBe('proj-1')
    expect(project.icons).toHaveLength(1)
    expect(project.activeIconId).toBe('icon-1')
    expect(project.nextIconNumber).toBe(2)
  })
})

describe('activeIconAtom lens', () => {
  it('reads the active icon from the project', () => {
    const store = makeStore()
    const icon = store.get(activeIconAtom)

    expect(icon.id).toBe('icon-1')
    expect(icon.name).toBe('Icon 1')
    expect(icon.shapes).toEqual([])
  })

  it('writes update the active icon inside the project', () => {
    const store = makeStore()
    const newIcon = makeIcon([], { id: 'custom', name: 'Custom' })

    store.set(activeIconAtom, newIcon)

    const icon = store.get(activeIconAtom)
    expect(icon.name).toBe('Custom')
    expect(icon.id).toBe('custom')

    const project = store.get(projectAtom)
    expect(project.activeIconId).toBe('custom')
    expect(project.icons[0].name).toBe('Custom')
  })

  it('supports Immer-style draft updates', () => {
    const store = makeStore()
    const rect = makeRect({ id: 'r1' })

    store.set(activeIconAtom, (draft) => {
      draft.shapes.push(rect)
    })

    expect(store.get(activeIconAtom).shapes).toHaveLength(1)
    expect(store.get(activeIconAtom).shapes[0].id).toBe('r1')
  })

  it('shapesAtom reads/writes through the lens', () => {
    const store = makeStore()
    const rect = makeRect({ id: 's1' })

    store.set(activeIconAtom, makeIcon([rect]))

    expect(store.get(shapesAtom)).toHaveLength(1)
    expect(store.get(shapesAtom)[0].id).toBe('s1')
  })

  it('reader throws when activeIconId points to a missing icon', () => {
    const store = makeStore()
    store.set(projectAtom, (draft) => {
      draft.activeIconId = 'nonexistent'
    })

    expect(() => store.get(activeIconAtom)).toThrow('not found in project')
  })

  it('writer throws when activeIconId points to a missing icon', () => {
    const store = makeStore()
    store.set(projectAtom, (draft) => {
      draft.activeIconId = 'nonexistent'
    })

    expect(() => {
      store.set(activeIconAtom, makeIcon())
    }).toThrow('not found in project')
  })

  it('writer with function updater throws for missing activeIconId', () => {
    const store = makeStore()
    store.set(projectAtom, (draft) => {
      draft.activeIconId = 'nonexistent'
    })

    expect(() => {
      store.set(activeIconAtom, (draft) => {
        draft.name = 'will not work'
      })
    }).toThrow('not found in project')
  })

  it('preserves other project fields when writing through the lens', () => {
    const store = makeStore()
    const beforeProject = store.get(projectAtom)

    store.set(activeIconAtom, (draft) => {
      draft.name = 'Renamed'
    })

    const afterProject = store.get(projectAtom)
    expect(afterProject.id).toBe(beforeProject.id)
    expect(afterProject.nextIconNumber).toBe(beforeProject.nextIconNumber)
  })
})

describe('Project-level history', () => {
  it('history entries snapshot the full Project', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', id: 'r1', x: 0, y: 0, width: 5, height: 5 })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)

    const entry = undo[0]
    expect(entry.before.icons).toBeDefined()
    expect(entry.before.activeIconId).toBeDefined()
    expect(entry.after.icons).toBeDefined()
    expect(entry.before.icons[0].shapes).toHaveLength(0)
    expect(entry.after.icons[0].shapes).toHaveLength(1)
  })

  it('undo/redo roundtrip restores the full project state', () => {
    const store = makeStore()
    const projectBefore = store.get(projectAtom)

    store.set(addShapeCommand, { type: 'rect', id: 'r1', x: 0, y: 0, width: 5, height: 5 })
    const projectAfterAdd = store.get(projectAtom)
    expect(store.get(activeIconAtom).shapes).toHaveLength(1)

    store.set(undoCommand)
    expect(store.get(projectAtom)).toEqual(projectBefore)
    expect(store.get(activeIconAtom).shapes).toHaveLength(0)

    store.set(redoCommand)
    expect(store.get(projectAtom)).toEqual(projectAfterAdd)
    expect(store.get(activeIconAtom).shapes).toHaveLength(1)
  })

  it('undo restores selection alongside the project', () => {
    const store = makeStore()
    const icon = makeIcon([makeRect({ id: 'a' }), makeRect({ id: 'b', x: 10 })])
    store.set(activeIconAtom, icon)
    seedSelection(store, ['a'])

    store.set(moveSelectionCommand, { ids: ['a'], dx: 5, dy: 5 })
    expect(store.get(selectedIdsAtom)).toEqual(['a'])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(activeIconAtom).shapes[0].x).toBe(0)
  })

  it('Immer structural sharing keeps unchanged icons stable', () => {
    const store = makeStore()
    const icon = makeIcon([makeRect({ id: 'r1' })])
    store.set(activeIconAtom, icon)

    const projectBefore = store.get(projectAtom)

    const renameCommand = createCommand<string>('Rename icon', (doc, name) => ({
      icon: { ...doc, name },
    }))
    store.set(renameCommand, 'Renamed')

    const projectAfter = store.get(projectAtom)
    expect(projectAfter).not.toBe(projectBefore)
    expect(projectAfter.icons[0].shapes).toBe(projectBefore.icons[0].shapes)
  })

  it('existing shape commands operate through the lens unchanged', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', id: 'r1', x: 0, y: 0, width: 10, height: 10 })
    expect(store.get(activeIconAtom).shapes).toHaveLength(1)
    expect(store.get(selectedIdsAtom)).toEqual(['r1'])

    store.set(moveSelectionCommand, { ids: ['r1'], dx: 5, dy: 5 })
    expect(store.get(activeIconAtom).shapes[0].x).toBe(5)
    expect(store.get(activeIconAtom).shapes[0].y).toBe(5)
  })
})
