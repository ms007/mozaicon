import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ColorPicker } from './ColorPicker'

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof meta>

function Stateful(props: React.ComponentProps<typeof ColorPicker>) {
  const [color, setColor] = useState(props.color)
  return (
    <div className="bg-popover text-popover-foreground w-72 rounded-md border p-3 shadow-md">
      <ColorPicker {...props} color={color} onChange={setColor} />
    </div>
  )
}

export const Default: Story = {
  args: { color: '#222222', onChange: () => undefined },
  render: (args) => <Stateful {...args} />,
}
