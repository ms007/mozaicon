import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { downloadBlob, downloadSvg, downloadTsx } from './download'
import { performExport } from './performExport'
import { rasterize } from './rasterize'

vi.mock('./download', () => ({
  downloadSvg: vi.fn(),
  downloadBlob: vi.fn(),
  downloadTsx: vi.fn(),
}))

vi.mock('./rasterize', () => ({
  rasterize: vi.fn().mockResolvedValue(new Blob(['fake-png'], { type: 'image/png' })),
}))

const doc = makeDoc([makeRect({ id: 's1', name: 'R1' })], { name: 'My Icon' })

describe('performExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('svg: downloads the optimized SVG as <kebab-slug>.svg', async () => {
    await performExport(doc, 'svg')

    expect(downloadSvg).toHaveBeenCalledOnce()
    const [svgContent, filename] = vi.mocked(downloadSvg).mock.calls[0]
    expect(filename).toBe('my-icon.svg')
    expect(svgContent).toContain('<svg')
    expect(downloadTsx).not.toHaveBeenCalled()
    expect(rasterize).not.toHaveBeenCalled()
  })

  it('tsx: downloads the generated component as <PascalName>.tsx', async () => {
    await performExport(doc, 'tsx')

    expect(downloadTsx).toHaveBeenCalledOnce()
    const [tsxContent, filename] = vi.mocked(downloadTsx).mock.calls[0]
    expect(filename).toBe('MyIcon.tsx')
    expect(tsxContent).toContain('export function MyIcon')
    expect(downloadSvg).not.toHaveBeenCalled()
    expect(rasterize).not.toHaveBeenCalled()
  })

  it.each([
    ['png1x', 1, 'my-icon.png'],
    ['png2x', 2, 'my-icon@2x.png'],
    ['png4x', 4, 'my-icon@4x.png'],
  ] as const)('%s: rasterizes at scale %i and downloads %s', async (target, scale, filename) => {
    await performExport(doc, target)

    expect(rasterize).toHaveBeenCalledOnce()
    const options = vi.mocked(rasterize).mock.calls[0][0]
    expect(options).toMatchObject({ scale, viewBox: doc.viewBox })
    expect(options.svgString).toContain('<svg')

    expect(downloadBlob).toHaveBeenCalledOnce()
    const [blob, name] = vi.mocked(downloadBlob).mock.calls[0]
    expect(blob).toBe(await vi.mocked(rasterize).mock.results[0].value)
    expect(name).toBe(filename)
  })

  it('logs and swallows pipeline errors instead of rethrowing', async () => {
    const error = new Error('canvas failed')
    vi.mocked(rasterize).mockRejectedValueOnce(error)
    const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn())

    await expect(performExport(doc, 'png1x')).resolves.toBeUndefined()

    expect(spy).toHaveBeenCalledWith('Export failed:', error)
    expect(downloadBlob).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
