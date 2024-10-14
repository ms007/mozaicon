import omit from '@/utils/omit'

export default function Rectangle({ width, height, size, ...props }) {
  const rest = omit(props, ['x', 'y'])

  return (
    <svg
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
    >
      <rect x={0} y={0} width={width} height={height} fill="currentColor" {...rest}></rect>
    </svg>
  )
}
