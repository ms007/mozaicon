import { CornerBottomLeft } from './CornerBottomLeft'
import { CornerBottomRight } from './CornerBottomRight'
import { CornersAll } from './CornersAll'
import { CornerTopLeft } from './CornerTopLeft'
import { CornerTopRight } from './CornerTopRight'
import { Draw } from './Draw'
import { Ellipse } from './Ellipse'
import { Erase } from './Erase'
import { Eye } from './Eye'
import { EyeOff } from './EyeOff'
import { Fill } from './Fill'
import { Line } from './Line'
import { Moon } from './Moon'
import { Rect } from './Rect'
import { Redo } from './Redo'
import { Sun } from './Sun'
import { Undo } from './Undo'

export {
  CornerBottomLeft,
  CornerBottomRight,
  CornersAll,
  CornerTopLeft,
  CornerTopRight,
  Draw,
  Ellipse,
  Erase,
  Eye,
  EyeOff,
  Fill,
  Line,
  Moon,
  Rect,
  Redo,
  Sun,
  Undo,
}
export { Icon } from './Icon'

export const toolIcons = [
  { name: 'Draw', component: Draw },
  { name: 'Erase', component: Erase },
  { name: 'Line', component: Line },
  { name: 'Rect', component: Rect },
  { name: 'Ellipse', component: Ellipse },
  { name: 'Fill', component: Fill },
] as const

export const headerIcons = [
  { name: 'Undo', component: Undo },
  { name: 'Redo', component: Redo },
  { name: 'Sun', component: Sun },
  { name: 'Moon', component: Moon },
] as const

export const utilityIcons = [
  { name: 'Eye', component: Eye },
  { name: 'EyeOff', component: EyeOff },
] as const

export const cornerIcons = [
  { name: 'CornersAll', component: CornersAll },
  { name: 'CornerTopLeft', component: CornerTopLeft },
  { name: 'CornerTopRight', component: CornerTopRight },
  { name: 'CornerBottomRight', component: CornerBottomRight },
  { name: 'CornerBottomLeft', component: CornerBottomLeft },
] as const
