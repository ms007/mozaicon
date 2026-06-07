import { saveAs } from 'file-saver'

export function downloadSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  saveAs(blob, filename)
}

export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}

export function downloadTsx(tsxContent: string, filename: string): void {
  const blob = new Blob([tsxContent], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}
