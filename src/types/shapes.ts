import { z } from 'zod'

export type ViewBox = [number, number, number, number]
export const DEFAULT_VIEWBOX: ViewBox = [0, 0, 24, 24]

export const ShapeBase = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
})

export const Radii = z.tuple([
  z.number().nonnegative(),
  z.number().nonnegative(),
  z.number().nonnegative(),
  z.number().nonnegative(),
])

export const CornerStyle = z.enum(['rounded', 'smooth'])

export const Corners = z.object({
  radii: Radii,
  style: CornerStyle,
  smoothing: z.number().min(0).max(100),
})

export const RectShape = ShapeBase.extend({
  type: z.literal('rect'),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  corners: Corners,
})

export const Shape = z.discriminatedUnion('type', [RectShape])

export const Icon = z.object({
  id: z.string(),
  name: z.string(),
  viewBox: z
    .tuple([z.number(), z.number(), z.number(), z.number()])
    .default((): ViewBox => [...DEFAULT_VIEWBOX]),
  shapes: z.array(Shape),
})

export const Project = z.object({
  id: z.string(),
  icons: z.array(Icon),
  activeIconId: z.string(),
  nextIconNumber: z.number().int().positive(),
})

export type ShapeBase = z.infer<typeof ShapeBase>
export type Radii = z.infer<typeof Radii>
export type CornerStyle = z.infer<typeof CornerStyle>
export type Corners = z.infer<typeof Corners>
export type RectShape = z.infer<typeof RectShape>
export type Shape = z.infer<typeof Shape>
export type Icon = z.infer<typeof Icon>
export type Project = z.infer<typeof Project>
