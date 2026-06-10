import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { draftShapeAtom } from '@/store/atoms/draft'
import { canRedoAtom, redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom, iconListAtom, projectAtom, shapeAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeIcon, makeProject, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'

import { addShapeCommand } from './addShape'
import { redoCommand, undoCommand } from './historyCommands'
import {
  addIconCommand,
  deleteIconCommand,
  renameIconCommand,
  switchIconCommand,
} from './iconCommands'

function makeStore(
  icons?: Parameters<typeof makeProject>[0],
  overrides?: Parameters<typeof makeProject>[1],
) {
  const store = createStore()
  store.set(projectAtom, makeProject(icons, overrides))
  return store
}

describe('addIconCommand', () => {
  it('appends a new icon and makes it active', () => {
    const store = makeStore()

    store.set(addIconCommand)

    const list = store.get(iconListAtom)
    expect(list).toHaveLength(2)
    expect(store.get(projectAtom).activeIconId).toBe(list[1].id)
  })

  it('assigns a default name using nextIconNumber', () => {
    const store = makeStore()

    store.set(addIconCommand)

    const list = store.get(iconListAtom)
    expect(list[1].name).toBe('Icon 1')
  })

  it('bumps nextIconNumber monotonically', () => {
    const store = makeStore()

    store.set(addIconCommand)
    store.set(addIconCommand)

    const project = store.get(projectAtom)
    expect(project.nextIconNumber).toBe(3)
    const list = store.get(iconListAtom)
    expect(list[1].name).toBe('Icon 1')
    expect(list[2].name).toBe('Icon 2')
  })

  it('never reuses a number after a delete', () => {
    const store = makeStore()

    store.set(addIconCommand)
    const firstAddedId = store.get(projectAtom).activeIconId
    expect(store.get(iconListAtom)[1].name).toBe('Icon 1')

    store.set(deleteIconCommand, firstAddedId)
    store.set(addIconCommand)

    const list = store.get(iconListAtom)
    expect(list[1].name).toBe('Icon 2')
  })

  it('reuses the number across add → undo → add (snapshot semantics, by design)', () => {
    const store = makeStore()

    store.set(addIconCommand)
    expect(store.get(iconListAtom)[1].name).toBe('Icon 1')

    store.set(undoCommand)
    store.set(addIconCommand)

    expect(store.get(iconListAtom)[1].name).toBe('Icon 1')
    expect(store.get(projectAtom).nextIconNumber).toBe(2)
  })

  it('inherits viewBox from the previously active icon', () => {
    const customViewBox = makeIcon([], { id: 'custom', viewBox: [0, 0, 48, 48] })
    const store = makeStore([customViewBox])

    store.set(addIconCommand)

    const newIcon = store.get(activeIconAtom)
    expect(newIcon.viewBox).toEqual([0, 0, 48, 48])
  })

  it('creates an icon with no shapes', () => {
    const withShapes = makeIcon([makeRect()], { id: 'has-shapes' })
    const store = makeStore([withShapes])

    store.set(addIconCommand)

    expect(store.get(activeIconAtom).shapes).toEqual([])
  })

  it('clears the current selection', () => {
    const doc = makeIcon([makeRect({ id: 's1' })], { id: 'icon-a' })
    const store = makeStore([doc])
    seedSelection(store, ['s1'])

    store.set(addIconCommand)

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('pushes exactly one history entry', () => {
    const store = makeStore()

    store.set(addIconCommand)

    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Add icon')
  })

  it('redo restores the added icon', () => {
    const store = makeStore()

    store.set(addIconCommand)
    const addedId = store.get(projectAtom).activeIconId

    store.set(undoCommand)
    expect(store.get(iconListAtom)).toHaveLength(1)

    store.set(redoCommand)
    expect(store.get(iconListAtom)).toHaveLength(2)
    expect(store.get(projectAtom).activeIconId).toBe(addedId)
  })

  it('clears the redo stack', () => {
    const store = makeStore()
    const proj = store.get(projectAtom)
    store.set(redoStackAtom, [
      { label: 'stale', before: proj, after: proj, selectionBefore: [], selectionAfter: [] },
    ])

    store.set(addIconCommand)

    expect(store.get(canRedoAtom)).toBe(false)
  })

  it('is a no-op during an active gesture', () => {
    const store = makeStore()
    store.set(draftShapeAtom, makeRect({ id: '__draft__' }))

    store.set(addIconCommand)

    expect(store.get(iconListAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})

describe('switchIconCommand', () => {
  it('switches the active icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(switchIconCommand, 'b')

    expect(store.get(projectAtom).activeIconId).toBe('b')
    expect(store.get(activeIconAtom).name).toBe('B')
  })

  it('clears selection on switch', () => {
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])
    seedSelection(store, ['s1'])

    store.set(switchIconCommand, 'b')

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('pushes exactly one history entry', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])

    store.set(switchIconCommand, 'b')

    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Switch icon')
  })

  it('is a no-op when switching to the already active icon', () => {
    const iconA = makeIcon([], { id: 'a' })
    const store = makeStore([iconA])

    store.set(switchIconCommand, 'a')

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when target icon does not exist', () => {
    const store = makeStore()

    store.set(switchIconCommand, 'nonexistent')

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('redo restores the switch', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(switchIconCommand, 'b')
    store.set(undoCommand)
    expect(store.get(projectAtom).activeIconId).toBe('a')

    store.set(redoCommand)
    expect(store.get(projectAtom).activeIconId).toBe('b')
  })

  it('is a no-op during an active gesture', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])
    store.set(draftShapeAtom, makeRect({ id: '__draft__' }))

    store.set(switchIconCommand, 'b')

    expect(store.get(projectAtom).activeIconId).toBe('a')
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})

describe('renameIconCommand', () => {
  it('renames the target icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old Name' })
    const store = makeStore([iconA])

    store.set(renameIconCommand, { iconId: 'a', name: 'New Name' })

    expect(store.get(iconListAtom)[0].name).toBe('New Name')
  })

  it('pushes exactly one history entry', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })

    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Rename icon')
  })

  it('undo restores the previous name', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })
    store.set(undoCommand)

    expect(store.get(iconListAtom)[0].name).toBe('Old')
  })

  it('redo restores the renamed value', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })
    store.set(undoCommand)
    store.set(redoCommand)

    expect(store.get(iconListAtom)[0].name).toBe('New')
  })

  it('is a no-op when name is unchanged', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Same' })
    const store = makeStore([iconA])

    store.set(renameIconCommand, { iconId: 'a', name: 'Same' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when target icon does not exist', () => {
    const store = makeStore()

    store.set(renameIconCommand, { iconId: 'nonexistent', name: 'X' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op during an active gesture', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])
    store.set(draftShapeAtom, makeRect({ id: '__draft__' }))

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })

    expect(store.get(iconListAtom)[0].name).toBe('Old')
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('clears the redo stack', () => {
    const iconA = makeIcon([], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])
    const proj = store.get(projectAtom)
    store.set(redoStackAtom, [
      { label: 'stale', before: proj, after: proj, selectionBefore: [], selectionAfter: [] },
    ])

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })

    expect(store.get(canRedoAtom)).toBe(false)
  })

  it('preserves selection through rename', () => {
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a', name: 'Old' })
    const store = makeStore([iconA])
    seedSelection(store, ['s1'])

    store.set(renameIconCommand, { iconId: 'a', name: 'New' })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })
})

describe('deleteIconCommand', () => {
  it('removes the target icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'b')

    expect(store.get(iconListAtom)).toHaveLength(1)
    expect(store.get(iconListAtom)[0].id).toBe('a')
  })

  it('is a no-op when only one icon remains (>=1 invariant)', () => {
    const store = makeStore()

    store.set(deleteIconCommand, store.get(projectAtom).icons[0].id)

    expect(store.get(iconListAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('selects previous sibling when deleting the active icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const iconC = makeIcon([], { id: 'c', name: 'C' })
    const store = makeStore([iconA, iconB, iconC], { activeIconId: 'b' })

    store.set(deleteIconCommand, 'b')

    expect(store.get(projectAtom).activeIconId).toBe('a')
  })

  it('selects next sibling when deleting the first active icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const iconC = makeIcon([], { id: 'c', name: 'C' })
    const store = makeStore([iconA, iconB, iconC], { activeIconId: 'a' })

    store.set(deleteIconCommand, 'a')

    expect(store.get(projectAtom).activeIconId).toBe('b')
  })

  it('keeps the active icon unchanged when deleting a non-active icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'b')

    expect(store.get(projectAtom).activeIconId).toBe('a')
  })

  it('clears selection when deleting the active icon', () => {
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])
    seedSelection(store, ['s1'])

    store.set(deleteIconCommand, 'a')

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('pushes exactly one history entry', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'a')

    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Delete icon')
  })

  it('undo restores the deleted icon', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'b')
    expect(store.get(iconListAtom)).toHaveLength(1)

    store.set(undoCommand)
    expect(store.get(iconListAtom)).toHaveLength(2)
    expect(store.get(iconListAtom)[1].id).toBe('b')
  })

  it('redo re-deletes the icon', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'b')
    store.set(undoCommand)
    store.set(redoCommand)

    expect(store.get(iconListAtom)).toHaveLength(1)
    expect(store.get(iconListAtom)[0].id).toBe('a')
  })

  it('clears the redo stack', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])
    const proj = store.get(projectAtom)
    store.set(redoStackAtom, [
      { label: 'stale', before: proj, after: proj, selectionBefore: [], selectionAfter: [] },
    ])

    store.set(deleteIconCommand, 'b')

    expect(store.get(canRedoAtom)).toBe(false)
  })

  it('is a no-op when target icon does not exist', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'nonexistent')

    expect(store.get(iconListAtom)).toHaveLength(2)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op during an active gesture', () => {
    const iconA = makeIcon([], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])
    store.set(draftShapeAtom, makeRect({ id: '__draft__' }))

    store.set(deleteIconCommand, 'b')

    expect(store.get(iconListAtom)).toHaveLength(2)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('evicts atomFamily entries for the deleted icon’s shape IDs', () => {
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a' })
    const iconB = makeIcon([], { id: 'b' })
    const store = makeStore([iconA, iconB])

    expect(store.get(shapeAtom('s1'))).toBeDefined()

    store.set(deleteIconCommand, 'a')

    expect(store.get(shapeAtom('s1'))).toBeUndefined()
  })
})

describe('deleteIconCommand — successor edge cases', () => {
  it('selects previous sibling when deleting the last icon in the list', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const iconC = makeIcon([], { id: 'c', name: 'C' })
    const store = makeStore([iconA, iconB, iconC], { activeIconId: 'c' })

    store.set(deleteIconCommand, 'c')

    expect(store.get(projectAtom).activeIconId).toBe('b')
    expect(store.get(iconListAtom)).toHaveLength(2)
  })

  it('undo after deleting active icon restores the original activeIconId', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB], { activeIconId: 'b' })

    store.set(deleteIconCommand, 'b')
    expect(store.get(projectAtom).activeIconId).toBe('a')

    store.set(undoCommand)
    expect(store.get(projectAtom).activeIconId).toBe('b')
    expect(store.get(iconListAtom)).toHaveLength(2)
  })

  it('preserves selection when deleting a non-active icon', () => {
    const iconA = makeIcon([makeRect({ id: 's1' })], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])
    seedSelection(store, ['s1'])

    store.set(deleteIconCommand, 'b')

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(projectAtom).activeIconId).toBe('a')
  })

  it('works correctly when deleting down to exactly 2 → 1 icons', () => {
    const iconA = makeIcon([], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    store.set(deleteIconCommand, 'b')
    expect(store.get(iconListAtom)).toHaveLength(1)

    store.set(deleteIconCommand, 'a')
    expect(store.get(iconListAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })
})

describe('history roundtrip across icon switch', () => {
  it('undo walks back through switch and restores previous icon + selection', () => {
    const shapeA = makeRect({ id: 'sa' })
    const iconA = makeIcon([shapeA], { id: 'a', name: 'A' })
    const iconB = makeIcon([], { id: 'b', name: 'B' })
    const store = makeStore([iconA, iconB])

    seedSelection(store, ['sa'])

    store.set(addShapeCommand, { type: 'rect', id: 'sb', x: 0, y: 0, width: 5, height: 5 })

    store.set(switchIconCommand, 'b')
    expect(store.get(projectAtom).activeIconId).toBe('b')
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(addShapeCommand, { type: 'rect', id: 'sc', x: 0, y: 0, width: 5, height: 5 })
    expect(store.get(selectedIdsAtom)).toEqual(['sc'])

    store.set(undoCommand)
    expect(store.get(activeIconAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(undoCommand)
    expect(store.get(projectAtom).activeIconId).toBe('a')
    expect(store.get(selectedIdsAtom)).toEqual(['sb'])

    store.set(undoCommand)
    expect(store.get(activeIconAtom).shapes).toHaveLength(1)
    expect(store.get(activeIconAtom).shapes[0].id).toBe('sa')
    expect(store.get(selectedIdsAtom)).toEqual(['sa'])
  })
})
