import type { Corners, Radii } from '@/types/shapes'

export const DEFAULT_CORNERS: Corners = { radii: [0, 0, 0, 0], style: 'rounded', smoothing: 0 }

export function clampRadii(radii: Radii, width: number, height: number): Radii {
  const max = Math.min(width, height) / 2
  return [
    Math.max(0, Math.min(radii[0], max)),
    Math.max(0, Math.min(radii[1], max)),
    Math.max(0, Math.min(radii[2], max)),
    Math.max(0, Math.min(radii[3], max)),
  ]
}

export function clampSmoothing(smoothing: number): number {
  return Number.isFinite(smoothing) ? Math.max(0, Math.min(100, smoothing)) : 0
}

export function normalizeCorners(corners: Corners, width: number, height: number): Corners {
  return {
    radii: clampRadii(corners.radii, width, height),
    style: corners.style,
    smoothing: clampSmoothing(corners.smoothing),
  }
}

export function isUniform(radii: Radii): boolean {
  return radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3]
}
