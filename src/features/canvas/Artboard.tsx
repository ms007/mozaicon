import type { ReactNode } from 'react'

export function Artboard({ children }: { children: ReactNode }) {
  // p-[calc(512px/24)] = one pixel-grid tile (canvas 512px / 24 default viewBox units).
  return <div className="bg-card rounded-xl p-[calc(512px/24)]">{children}</div>
}
