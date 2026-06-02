export type Modifier = 'mod' | 'shift' | 'alt'

export interface BindingSpec {
  key: string
  // Physical-key fallback (e.g. 'BracketLeft'). On macOS, holding Option
  // composes a glyph so `event.key` for Option+[ becomes "“" rather than "[";
  // matching `event.code` sidesteps the layout remap. See `matches`.
  code?: string
  modifiers?: Modifier[]
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

// Chrome freezes `navigator.platform` to "Win32" in some contexts (e.g. headless
// Playwright on macOS), so we consult `userAgentData.platform` first and only
// fall back to the legacy fields. See https://wicg.github.io/ua-client-hints/.
function detectIsMac(): boolean {
  if (typeof navigator === 'undefined') return false
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
  if (uaData?.platform) return /mac/i.test(uaData.platform)
  if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) return true
  return navigator.userAgent.includes('Mac OS X')
}

const IS_MAC = detectIsMac()

// Display labels for modifiers — "Cmd"/"Option" on macOS, "Ctrl"/"Alt"
// elsewhere — surfaced via binding `hint` strings (e.g. tooltips).
export const MOD_KEY_LABEL = IS_MAC ? 'Cmd' : 'Ctrl'
export const ALT_KEY_LABEL = IS_MAC ? 'Option' : 'Alt'

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
  const keyMatches = event.key.toLowerCase() === binding.key.toLowerCase()
  const codeMatches = binding.code !== undefined && event.code === binding.code
  if (!keyMatches && !codeMatches) return false

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
