import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'beta' },
}

export const Primary: Story = {
  args: { variant: 'primary', children: 'new' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'draft' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">beta</Badge>
      <Badge variant="primary">new</Badge>
      <Badge variant="outline">draft</Badge>
    </div>
  ),
}
