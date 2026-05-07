import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'

import { Ellipse, Rect } from '@/icons'

import { LayerItem } from './LayerItem'

const noop = () => undefined

const meta = {
  title: 'Features/Layers/LayerItem',
  component: LayerItem,
  parameters: { layout: 'centered' },
  args: {
    icon: <Rect className="size-3.5" />,
    name: 'Rectangle 1',
    visible: true,
    selected: false,
    onSelect: noop,
    onToggleVisible: noop,
    onRename: noop,
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LayerItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true },
}

export const Hidden: Story = {
  args: { visible: false },
}

export const HiddenAndSelected: Story = {
  args: { visible: false, selected: true },
}

export const LongName: Story = {
  args: { name: 'This is an extremely long layer name that should truncate' },
}

export const WithCustomIcon: Story = {
  args: { icon: <Ellipse className="size-3.5" /> },
}

function EditingPlayground() {
  const [name, setName] = useState('Background')
  const [visible, setVisible] = useState(true)
  const [selected, setSelected] = useState(false)

  return (
    <LayerItem
      icon={<Rect className="size-3.5" />}
      name={name}
      visible={visible}
      selected={selected}
      onSelect={() => {
        setSelected(true)
      }}
      onToggleVisible={() => {
        setVisible((v) => !v)
      }}
      onRename={(next) => {
        setName(next)
      }}
    />
  )
}

export const Editing: Story = {
  render: () => <EditingPlayground />,
}

interface LayerRow {
  id: string
  name: string
  icon: ReactNode
  visible: boolean
}

function LayerListPlayground() {
  const [rows, setRows] = useState<LayerRow[]>([
    { id: '1', name: 'Background', icon: <Rect className="size-3.5" />, visible: true },
    { id: '2', name: 'Icon Shape', icon: <Ellipse className="size-3.5" />, visible: true },
    { id: '3', name: 'Shadow', icon: <Rect className="size-3.5" />, visible: false },
    { id: '4', name: 'Border Highlight', icon: <Ellipse className="size-3.5" />, visible: true },
  ])
  const [selectedId, setSelectedId] = useState<string | null>('2')

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((row) => (
        <LayerItem
          key={row.id}
          icon={row.icon}
          name={row.name}
          visible={row.visible}
          selected={row.id === selectedId}
          onSelect={() => {
            setSelectedId(row.id)
          }}
          onToggleVisible={() => {
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, visible: !r.visible } : r)),
            )
          }}
          onRename={(next) => {
            setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: next } : r)))
          }}
        />
      ))}
    </div>
  )
}

export const LayerList: Story = {
  render: () => <LayerListPlayground />,
}
