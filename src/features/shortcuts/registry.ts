import type { BindingSpec } from './match'

export interface ShortcutBinding extends BindingSpec {
  id: string
  label: string
  hint: string
  run: () => void
}

// Dev-only collision check. First match wins at dispatch time.
export function buildBindings(bindings: ShortcutBinding[]): ShortcutBinding[] {
  if (import.meta.env.DEV) {
    const seen = new Map<string, string>()
    for (const b of bindings) {
      const mods = [...new Set(b.modifiers ?? [])].sort().join('+')
      const fingerprint = `${b.key.toLowerCase()}|${mods}`
      const existing = seen.get(fingerprint)
      if (existing) {
        throw new Error(`Shortcut collision: "${b.id}" and "${existing}" both bind ${fingerprint}`)
      }
      seen.set(fingerprint, b.id)
    }
  }
  return bindings
}

export function getHint(
  meta: readonly { id: string; hint: string }[],
  id: string,
): string | undefined {
  return meta.find((m) => m.id === id)?.hint
}
