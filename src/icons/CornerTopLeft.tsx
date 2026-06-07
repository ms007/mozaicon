import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function CornerTopLeft(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2 8V3.5A1.5 1.5 0 0 1 3.5 2H8" />
    </Icon>
  )
}
