export async function optimizeSvg(raw: string): Promise<string> {
  // Dynamic import keeps SVGO (~550KB) out of the startup chunk; the
  // '/browser' entry avoids the node build (os/fs imports) Vite would stub.
  const { optimize } = await import('svgo/browser')
  const result = optimize(raw, {
    plugins: ['preset-default'],
  })
  return result.data
}
