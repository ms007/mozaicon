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

export const RectShape = ShapeBase.extend({
  type: z.literal('rect'),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  rx: z.number().nonnegative().optional(),
})

export const Shape = z.discriminatedUnion('type', [RectShape])

export const Document = z.object({
  id: z.string(),
  name: z.string(),
  viewBox: z
    .tuple([z.number(), z.number(), z.number(), z.number()])
    .default((): ViewBox => [...DEFAULT_VIEWBOX]),
  shapes: z.array(Shape),
})

export type ShapeBase = z.infer<typeof ShapeBase>
export type RectShape = z.infer<typeof RectShape>
export type Shape = z.infer<typeof Shape>
export type Document = z.infer<typeof Document>
