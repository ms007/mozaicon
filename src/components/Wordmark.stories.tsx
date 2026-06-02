import type { Meta, StoryObj } from '@storybook/react-vite'

import { Wordmark } from './Wordmark'

const meta = {
  title: 'Components/Wordmark',
  component: Wordmark,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Wordmark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { height: 32, className: 'text-foreground' },
}

export const Small: Story = {
  args: { height: 20, className: 'text-foreground' },
}

export const Large: Story = {
  args: { height: 64, className: 'text-foreground' },
}

export const CustomColor: Story = {
  args: { height: 32, className: 'text-primary' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Wordmark height={16} className="text-foreground" />
      <Wordmark height={20} className="text-foreground" />
      <Wordmark height={32} className="text-foreground" />
      <Wordmark height={48} className="text-foreground" />
      <Wordmark height={64} className="text-foreground" />
    </div>
  ),
}
