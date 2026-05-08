import { rectTool } from './rect'
import type { DrawToolMap } from './registry'

export const drawTools: DrawToolMap = {
  [rectTool.id]: rectTool,
}
