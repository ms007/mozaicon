import { symmetricDifference } from '@/lib/selection'

import { createCommand } from './createCommand'

export const selectShapesCommand = createCommand<string[]>('Select shapes', (_doc, ids) => ({
  selection: ids,
}))

export const toggleSelectionCommand = createCommand<string>(
  'Toggle selection',
  (_doc, id, selection) => ({ selection: symmetricDifference(selection, [id]) }),
)

export const clearSelectionCommand = createCommand<undefined>('Clear selection', () => ({
  selection: [],
}))
