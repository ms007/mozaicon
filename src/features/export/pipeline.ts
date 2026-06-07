import type { Document } from '@/types/shapes'

import { optimizeSvg } from './optimize'
import { serializeDocument } from './serialize'

export function exportSvg(doc: Document): Promise<string> {
  const raw = serializeDocument(doc)
  return optimizeSvg(raw)
}
