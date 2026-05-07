import type { Meta, StoryObj } from '@storybook/react-vite'

import { headerIcons, toolIcons, utilityIcons } from '@/icons'

function IconGrid({ icons }: { icons: readonly { name: string; component: React.FC }[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4">
      {icons.map(({ name, component: C }) => (
        <div key={name} className="flex flex-col items-center gap-2 rounded-md border p-3">
          <C />
          <span className="text-muted-foreground text-xs">{name}</span>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'Icons/Catalog',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const ToolIcons: Story = {
  render: () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Tool Icons (stroke 1.3)</h3>
      <IconGrid icons={toolIcons} />
    </div>
  ),
}

export const HeaderIcons: Story = {
  render: () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Header Icons (stroke 1.5)</h3>
      <IconGrid icons={headerIcons} />
    </div>
  ),
}

export const UtilityIcons: Story = {
  render: () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Utility Icons (stroke 1.3)</h3>
      <IconGrid icons={utilityIcons} />
    </div>
  ),
}

export const AllIcons: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Tool Icons (stroke 1.3)</h3>
        <IconGrid icons={toolIcons} />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Header Icons (stroke 1.5)</h3>
        <IconGrid icons={headerIcons} />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Utility Icons (stroke 1.3)</h3>
        <IconGrid icons={utilityIcons} />
      </div>
    </div>
  ),
}
