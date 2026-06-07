import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function CornersAll(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2 5V3.5A1.5 1.5 0 0 1 3.5 2H5" />
      <path d="M9 2h1.5A1.5 1.5 0 0 1 12 3.5V5" />
      <path d="M12 9v1.5a1.5 1.5 0 0 1-1.5 1.5H9" />
      <path d="M5 12H3.5A1.5 1.5 0 0 1 2 10.5V9" />
    </Icon>
  )
}
