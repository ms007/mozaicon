import type { Meta, StoryObj } from '@storybook/react-vite'

import { Slider } from './Slider'

const meta = {
  title: 'Primitives/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    // In real usage the slider thumb is labelled by the surrounding property
    // row (e.g. "Opacity"). The bare primitive has no context to label itself,
    // so we disable the rule here rather than inventing a fake label.
    a11y: { config: { rules: [{ id: 'aria-input-field-name', enabled: false }] } },
  },
  decorators: [(Story) => <div className="w-64">{Story()}</div>],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: [50], min: 0, max: 100 },
}

export const CustomRange: Story = {
  args: { defaultValue: [180], min: 0, max: 360, step: 1 },
}

export const SmallStep: Story = {
  args: { defaultValue: [0.5], min: 0, max: 1, step: 0.01 },
}

export const Disabled: Story = {
  args: { defaultValue: [30], min: 0, max: 100, disabled: true },
}

export const RangeSlider: Story = {
  args: { defaultValue: [20, 80], min: 0, max: 100 },
}
