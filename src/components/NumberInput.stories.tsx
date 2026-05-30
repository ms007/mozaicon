import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput } from './NumberInput'

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NumberInput>

export default meta
type Story = StoryObj<typeof meta>

function Stateful(props: Omit<React.ComponentProps<typeof NumberInput>, 'onCommit'>) {
  const [value, setValue] = useState(props.value)
  return <NumberInput {...props} value={value} onCommit={setValue} />
}

const noop = () => undefined

export const Default: Story = {
  args: { value: 24, label: 'Size', step: 1, onCommit: noop },
  render: (args) => <Stateful {...args} />,
}

export const AxisLabel: Story = {
  args: { value: 100, label: 'X position', step: 1, prefix: 'X', onCommit: noop },
  render: (args) => <Stateful {...args} />,
}

export const UnitSuffix: Story = {
  args: { value: 16, label: 'Font size', step: 1, suffix: 'px', onCommit: noop },
  render: (args) => <Stateful {...args} />,
}

export const LeadingIcon: Story = {
  args: {
    value: 360,
    label: 'Rotation',
    step: 1,
    min: 0,
    max: 360,
    prefix: '↻',
    suffix: '°',
    onCommit: noop,
  },
  render: (args) => <Stateful {...args} />,
}

export const WithPrecision: Story = {
  args: {
    value: 1.5,
    label: 'Opacity',
    step: 0.1,
    fineStep: 0.01,
    precision: 2,
    min: 0,
    max: 1,
    onCommit: noop,
  },
  render: (args) => <Stateful {...args} />,
}

export const Disabled: Story = {
  args: { value: 42, label: 'Locked', disabled: true, suffix: 'px', onCommit: noop },
  render: (args) => <Stateful {...args} />,
}

function AxisGroup() {
  const [x, setX] = useState(100)
  const [y, setY] = useState(200)
  const [w, setW] = useState(48)
  const [h, setH] = useState(48)
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput value={x} onCommit={setX} label="X position" prefix="X" step={1} />
      <NumberInput value={y} onCommit={setY} label="Y position" prefix="Y" step={1} />
      <NumberInput value={w} onCommit={setW} label="Width" prefix="W" step={1} min={1} />
      <NumberInput value={h} onCommit={setH} label="Height" prefix="H" step={1} min={1} />
    </div>
  )
}

export const PositionAndSize: Story = {
  args: { value: 0, label: 'X', step: 1, onCommit: noop },
  render: () => <AxisGroup />,
}
