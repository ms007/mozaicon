export type Modifier = 'mod' | 'shift' | 'alt'

export interface BindingSpec {
  key: string
  modifiers?: Modifier[]
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (EDITABLE_TAGS.has(target.tagName)) return true
  if (target.isContentEditable) return true
  return false
}

// `mod` resolves to Meta on macOS, Ctrl elsewhere. Bindings without declared
// modifiers must match with no modifier held; bindings with declared modifiers
// must match exactly — extra modifiers cause a miss.
export function matches(event: KeyboardEvent, binding: BindingSpec): boolean {
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) return false

  const declared = binding.modifiers ?? []
  const wantMod = declared.includes('mod')
  const wantShift = declared.includes('shift')
  const wantAlt = declared.includes('alt')

  const hasMod = IS_MAC ? event.metaKey : event.ctrlKey
  const hasOtherMeta = IS_MAC ? event.ctrlKey : event.metaKey

  if (wantMod !== hasMod) return false
  if (wantShift !== event.shiftKey) return false
  if (wantAlt !== event.altKey) return false
  if (hasOtherMeta) return false

  return true
}
