import type { Document } from '@/types/shapes'

import { generateTsx } from './codegen'
import { optimizeSvg } from './optimize'
import { serializeDocument } from './serialize'

export function exportSvg(doc: Document): Promise<string> {
  const raw = serializeDocument(doc)
  return optimizeSvg(raw)
}

export async function exportTsx(doc: Document, componentName: string): Promise<string> {
  return generateTsx(await exportSvg(doc), componentName)
}
