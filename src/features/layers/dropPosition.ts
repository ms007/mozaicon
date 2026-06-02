export function computeBeforeId(
  layerIds: string[],
  activeId: string,
  overId: string,
): string | null {
  if (activeId === overId) return null
  const activeIndex = layerIds.indexOf(activeId)
  const overIndex = layerIds.indexOf(overId)
  if (activeIndex === -1 || overIndex === -1) return null

  const gapIndex = activeIndex < overIndex ? overIndex + 1 : overIndex
  return gapIndex === 0 ? null : layerIds[gapIndex - 1]
}

export function computeDropIndicatorIndex(
  layerIds: string[],
  activeId: string,
  overId: string,
): number | null {
  if (activeId === overId) return null
  const activeIndex = layerIds.indexOf(activeId)
  const overIndex = layerIds.indexOf(overId)
  if (activeIndex === -1 || overIndex === -1) return null
  return activeIndex < overIndex ? overIndex + 1 : overIndex
}
