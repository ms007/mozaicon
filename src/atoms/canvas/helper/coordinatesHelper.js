export function getCoordinates(x, y, width, height) {
  const topLeft = { x, y }
  const topRight = { x: x + width, y }
  const bottomRight = { x: x + width, y: y + height }
  const bottomLeft = { x, y: y + height }

  const topCenter = { x: x + width / 2, y }
  const bottomCenter = { x: x + width / 2, y: y + height }
  const leftCenter = { x, y: y + height / 2 }
  const rightCenter = { x: x + width, y: y + height / 2 }

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    topCenter,
    bottomCenter,
    leftCenter,
    rightCenter,
    width,
    height,
  }
}
