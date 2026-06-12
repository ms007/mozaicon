import type { SVGProps } from 'react'

export function MyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <rect width={20} height={20} x={2} y={2} fill="#f60" stroke="#333" />
      <rect width={12} height={12} x={6} y={6} fill="#fff" stroke="#000" strokeWidth={2} />
    </svg>
  )
}
