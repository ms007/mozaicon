import { useAtomValue, useSetAtom } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/icons/Icon'
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
          size="icon-xs"
          variant="ghost"
          aria-label="Add icon"
          onClick={() => {
            addIcon()
          }}
        >
          <Icon aria-hidden>
            <line x1="7" y1="3" x2="7" y2="11" />
            <line x1="3" y1="7" x2="11" y2="7" />
          </Icon>
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
