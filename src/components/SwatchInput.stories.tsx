import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { SwatchInput } from './SwatchInput'

const meta = {
  title: 'Components/SwatchInput',
  component: SwatchInput,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SwatchInput>

export default meta
type Story = StoryObj<typeof meta>

function Stateful(props: React.ComponentProps<typeof SwatchInput>) {
  const [color, setColor] = useState(props.color)
  return (
    <div className="bg-popover text-popover-foreground w-48 rounded-md border p-3 shadow-md">
      <SwatchInput
        {...props}
        color={color}
        onChange={setColor}
        onSwatchClick={() => {
          alert('Open color picker')
        }}
      />
    </div>
  )
}

export const Default: Story = {
  args: { color: '#3b82f6', onChange: () => undefined },
  render: (args) => <Stateful {...args} />,
}

export const Active: Story = {
  args: { color: '#ff5500', onChange: () => undefined, swatchActive: true },
  render: (args) => <Stateful {...args} />,
}
