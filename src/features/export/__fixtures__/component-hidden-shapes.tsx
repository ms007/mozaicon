import type { SVGProps } from 'react'

export function MyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <rect width={4} height={4} x={10} y={10} fill="red" />
    </svg>
  )
}
