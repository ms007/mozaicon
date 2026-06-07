import { useAtomValue } from 'jotai'
import { useState } from 'react'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import {
  CornerBottomLeft,
  CornerBottomRight,
  CornersAll,
  CornerTopLeft,
  CornerTopRight,
} from '@/icons'
import {
  type SelectionCornerRadii,
  selectionCornerRadiiAtom,
} from '@/store/atoms/selection-corner-radii'
import { MIXED } from '@/store/atoms/selection-geometry'

import { RadiusField } from './RadiusField'

function uniformValue(radii: SelectionCornerRadii) {
  const { tl, tr, br, bl } = radii
  if (tl === MIXED || tr === MIXED || br === MIXED || bl === MIXED) return MIXED
  if (tl === tr && tr === br && br === bl) return tl
  return MIXED
}

export function AppearanceSection() {
  const radii = useAtomValue(selectionCornerRadiiAtom)
  const [expanded, setExpanded] = useState(false)

  if (!radii.hasRects) return null

  return (
    <PanelSection title="Appearance">
      {expanded ? (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1fr_auto] items-start gap-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <RadiusField
                fieldKey="tl"
                label="Top Left"
                value={radii.tl}
                icon={<CornerTopLeft width={12} height={12} />}
              />
              <RadiusField
                fieldKey="tr"
                label="Top Right"
                value={radii.tr}
                icon={<CornerTopRight width={12} height={12} />}
              />
              <RadiusField
                fieldKey="bl"
                label="Bottom Left"
                value={radii.bl}
                icon={<CornerBottomLeft width={12} height={12} />}
              />
              <RadiusField
                fieldKey="br"
                label="Bottom Right"
                value={radii.br}
                icon={<CornerBottomRight width={12} height={12} />}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              pressed={true}
              onClick={() => {
                setExpanded(false)
              }}
              aria-label="Collapse corner radius"
            >
              <CornersAll />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-center gap-1.5">
          <RadiusField
            fieldKey="uniform"
            label="Corner Radius"
            value={uniformValue(radii)}
            icon={<CornersAll width={12} height={12} />}
            suffix="px"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setExpanded(true)
            }}
            aria-label="Expand corner radius"
          >
            <CornersAll />
          </Button>
        </div>
      )}
    </PanelSection>
  )
}
