import type { Icon } from '@/types/shapes'

import { generateTsx } from './codegen'
import { optimizeSvg } from './optimize'
import { serializeIcon } from './serialize'

export function exportSvg(doc: Icon): Promise<string> {
  const raw = serializeIcon(doc)
  return optimizeSvg(raw)
}

export async function exportTsx(doc: Icon, componentName: string): Promise<string> {
  return generateTsx(await exportSvg(doc), componentName)
}
