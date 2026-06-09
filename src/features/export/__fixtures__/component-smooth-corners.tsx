import type { SVGProps } from 'react'

export function MyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <path d="M6 2h12c3.284 0 4 .716 4 4v12c0 3.284-.716 4-4 4H6c-3.284 0-4-.716-4-4V6c0-3.284.716-4 4-4" />
    </svg>
  )
}
