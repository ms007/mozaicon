import type { MarqueeDraft } from '@/store/atoms/marquee-draft'

const baseDraft: MarqueeDraft = {
  pointerId: 1,
  startScreen: { x: 0, y: 0 },
  startViewBox: { x: 0, y: 0 },
  current: { x: 0, y: 0 },
  additive: false,
  baseSelection: [],
}

export function makeMarqueeDraft(overrides: Partial<MarqueeDraft> = {}): MarqueeDraft {
  return { ...baseDraft, ...overrides }
}
