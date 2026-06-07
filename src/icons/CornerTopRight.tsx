import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function CornerTopRight(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M6 2h4.5A1.5 1.5 0 0 1 12 3.5V8" />
    </Icon>
  )
}
