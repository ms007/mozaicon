import { useAtomValue, useSetAtom } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { iconListAtom } from '@/store/atoms/project'
import { addIconCommand } from '@/store/commands/iconCommands'

import { IconItem } from './IconItem'

export function IconsPanel() {
  const icons = useAtomValue(iconListAtom)
  const addIcon = useSetAtom(addIconCommand)

  return (
    <PanelSection
      title="Icons"
      className="max-h-36 shrink-0"
      headerAction={
        <Button
          size="icon"
          variant="ghost"
          aria-label="Add icon"
          onClick={() => {
            addIcon()
          }}
        >
          +
        </Button>
      }
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
        role="listbox"
        aria-label="Icon list"
      >
        {icons.map((icon) => (
          <IconItem key={icon.id} icon={icon} iconCount={icons.length} />
        ))}
      </div>
    </PanelSection>
  )
}
