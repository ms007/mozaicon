import { isValidElement, Children, cloneElement } from 'react'

import omit from '@/utils/omit'

export function Shape({ children, ...props }) {
  const validProps = omit(props, ['id', 'isMoving'])

  if (isValidElement(children)) {
    return cloneElement(children, {
      ...validProps,
      ...children.props,
    })
  }

  if (Children.count(children) > 1) {
    Children.only(null)
  }

  return null
}
