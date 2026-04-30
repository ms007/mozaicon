import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TooltipProvider } from '@/components/primitives/Tooltip'
import { Ellipse, Rect, toolIcons } from '@/icons'

import { type ToolOption, ToolPalette } from './ToolPalette'

const noop = () => undefined

const meta = {
  title: 'Components/ToolPalette',
  component: ToolPalette,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof ToolPalette>

export default meta
type Story = StoryObj<typeof meta>

const twoTools: ToolOption[] = [
  { value: 'rect', icon: <Rect />, label: 'Rectangle', shortcut: 'R' },
  { value: 'ellipse', icon: <Ellipse />, label: 'Ellipse', shortcut: 'O' },
]

export const Default: Story = {
  args: {
    options: twoTools,
    value: 'rect',
    onChange: noop,
    'aria-label': 'Drawing tools',
  },
}

export const EllipseActive: Story = {
  args: {
    options: twoTools,
    value: 'ellipse',
    onChange: noop,
    'aria-label': 'Drawing tools',
  },
}

function InteractiveToolPalette() {
  const [value, setValue] = useState('rect')
  return (
    <ToolPalette options={twoTools} value={value} onChange={setValue} aria-label="Drawing tools" />
  )
}

export const Interactive: Story = {
  args: {
    options: twoTools,
    value: 'rect',
    onChange: noop,
    'aria-label': 'Drawing tools',
  },
  render: () => <InteractiveToolPalette />,
}

const sixTools: ToolOption[] = toolIcons.map((t) => ({
  value: t.name.toLowerCase(),
  icon: <t.component />,
  label: t.name,
}))

export const SixTools: Story = {
  args: {
    options: sixTools,
    value: 'rect',
    onChange: noop,
    'aria-label': 'Drawing tools',
  },
}
