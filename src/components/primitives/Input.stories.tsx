import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './Input'

const meta = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Demo input' },
  decorators: [(Story) => <div className="w-64">{Story()}</div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: 'Enter value…' },
}

export const WithValue: Story = {
  args: { defaultValue: '128' },
}

export const NumberType: Story = {
  args: { type: 'number', defaultValue: '360', min: 0, max: 360, step: 1 },
}

export const Placeholder: Story = {
  args: { placeholder: 'Width' },
}

export const Disabled: Story = {
  args: { defaultValue: '64', disabled: true },
}

export const Invalid: Story = {
  args: { defaultValue: 'abc', 'aria-invalid': true },
}
