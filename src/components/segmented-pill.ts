// Mirror the container's horizontal `p-0.5` (2px each side) so the pill aligns
// with the items inside the padding instead of running flush with the rounded
// container edge — otherwise the pill's left/right corners get visually clipped.
export function getPillStyle(activeIndex: number, count: number): { left: string; width: string } {
  const safeIndex = Math.max(activeIndex, 0)
  return {
    left: `calc((100% - 0.25rem) * ${safeIndex.toString()} / ${count.toString()} + 0.125rem)`,
    width: `calc((100% - 0.25rem) / ${count.toString()})`,
  }
}
