import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function CornerBottomRight(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M12 6v4.5a1.5 1.5 0 0 1-1.5 1.5H6" />
    </Icon>
  )
}
