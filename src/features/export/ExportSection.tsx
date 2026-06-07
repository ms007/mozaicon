import { useAtom, useAtomValue, useStore } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { documentAtom } from '@/store/atoms/document'
import { allExportDisabledAtom, type ExportTarget, exportTargetAtom } from '@/store/atoms/export'

import { performExport } from './performExport'

const TARGETS: { id: ExportTarget; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'tsx', label: 'TSX' },
  { id: 'png1x', label: '1x' },
  { id: 'png2x', label: '2x' },
  { id: 'png4x', label: '4x' },
]

export function ExportSection() {
  const store = useStore()
  const allDisabled = useAtomValue(allExportDisabledAtom)
  const [stickyTarget, setStickyTarget] = useAtom(exportTargetAtom)

  const handleClick = (target: ExportTarget) => {
    setStickyTarget(target)
    void performExport(store.get(documentAtom), target)
  }

  return (
    <PanelSection title="Export">
      <div className="grid grid-cols-5 gap-1.5">
        {TARGETS.map(({ id, label }) => {
          const variant = !allDisabled && stickyTarget === id ? 'primary' : 'default'

          return (
            <Button
              key={id}
              variant={variant}
              size="default"
              disabled={allDisabled}
              onClick={() => {
                handleClick(id)
              }}
              aria-label={`Export ${label}`}
            >
              {label}
            </Button>
          )
        })}
      </div>
    </PanelSection>
  )
}
