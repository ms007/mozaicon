import Rectangle from './Rectangle'

const shapes = {
  rectangle: Rectangle,
}

function createShape(shape) {
  const { type } = shape
  return shapes[type]
}

export { Rectangle, createShape }
