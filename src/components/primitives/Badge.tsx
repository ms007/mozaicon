// FORKED from @/components/ui/badge at shadcn 2026-06-02.
//
// Pattern 3 (see docs/ui-primitives.md). The shadcn variant set is collapsed
// onto the DS vocabulary:
//   shadcn `secondary` (neutral tint)   → our `default`  (quiet status tag)
//   shadcn `default` (bg-primary)        → our `primary`  (brand emphasis)
//   shadcn `outline`                      → kept           (bordered, no fill)
//   shadcn `destructive`/`ghost`/`link`   → removed
// Radius is `rounded-md` to match the DS compact-control convention rather
// than shadcn's `rounded-full` pill.

import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden',
    'rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
    'transition-colors',
    '[&>svg]:pointer-events-none [&>svg]:size-3',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-muted-foreground',
        primary: 'border-transparent bg-primary text-primary-foreground',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariantProps = VariantProps<typeof badgeVariants>

export type BadgeVariant = NonNullable<BadgeVariantProps['variant']>

export type BadgeProps = ComponentProps<'span'> &
  BadgeVariantProps & {
    asChild?: boolean
  }

function Badge({ className, variant = 'default', asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge }
