import type { SVGProps } from 'react'

export function MyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <rect x={10} y={10} width={4} height={4} fill="#f00" />
    </svg>
  )
}
