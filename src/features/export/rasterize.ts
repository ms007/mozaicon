export interface RasterizeOptions {
  svgString: string
  viewBox: [number, number, number, number]
  scale: number
}

export function rasterize({ svgString, viewBox, scale }: RasterizeOptions): Promise<Blob> {
  const [, , w, h] = viewBox
  const width = Math.round(w * scale)
  const height = Math.round(h * scale)
  // Safari/older Firefox can't drawImage an SVG without intrinsic dimensions
  // (the optimized export root carries only xmlns + viewBox), so inject
  // explicit width/height before loading it into the Image.
  const sized = svgString.replace(
    /<svg/,
    `<svg width="${String(width)}" height="${String(height)}"`,
  )

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get 2d context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error('canvas.toBlob returned null'))
        }
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG into Image'))
    }

    img.src = url
  })
}
