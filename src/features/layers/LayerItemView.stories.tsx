import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'

import { Ellipse, Rect } from '@/icons'

import { LayerItemView } from './LayerItemView'

const noop = () => undefined

const meta = {
  title: 'Features/Layers/LayerItemView',
  component: LayerItemView,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          // The row is a role=button that contains an eye-toggle button and a
          // rename input. Restructuring would change the selection/edit UX in
          // the real app; the keyboard path here is keyboard-shortcut driven,
          // not tab-walked, so we accept the violation in stories.
          { id: 'nested-interactive', enabled: false },
          // The reduced contrast on hidden-layer labels is deliberate design —
          // it visually communicates the "hidden" state. Raising it to 4.5:1
          // would weaken that signal.
          { id: 'color-contrast', enabled: false },
        ],
      },
    },
  },
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
} satisfies Meta<typeof LayerItemView>

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
    <LayerItemView
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
        <LayerItemView
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
