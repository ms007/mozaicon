import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Eye(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" />
      <circle cx="7" cy="7" r="1.5" />
    </Icon>
  )
}
