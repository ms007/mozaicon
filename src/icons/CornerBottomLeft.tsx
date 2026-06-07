import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function CornerBottomLeft(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M8 12H3.5A1.5 1.5 0 0 1 2 10.5V6" />
    </Icon>
  )
}
