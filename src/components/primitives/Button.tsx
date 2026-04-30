// FORKED from @/components/ui/button at shadcn 2026-04-24.
//
// Pattern 3 canonical example (see docs/ui-primitives.md). The shadcn default
// variant set is collapsed onto the DS vocabulary:
//   shadcn `default` (bg-primary)     → our `primary`   (loud export action)
//   shadcn `outline` (border+bg)      → our `default`   (quiet chrome)
//   shadcn `ghost`/`destructive`       → kept
//   shadcn `secondary`/`link`          → removed
// The `pressed` prop surfaces toggle state via `aria-pressed`; pressed-state
// styling is keyed off the DOM attribute via Tailwind's `aria-pressed:*`
// variant, not via a conditional className — one source of truth for
// accessibility and visual state.

import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-1 rounded-md cursor-pointer select-none',
    'text-md font-medium whitespace-nowrap outline-none',
    'transition-colors active:scale-[0.97]',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:pointer-events-none disabled:opacity-30',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    'aria-pressed:bg-primary-muted aria-pressed:border-primary aria-pressed:text-primary-subtle',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'border bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border-hover',
        primary:
          'border border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:border-primary-hover',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive-hover hover:border-destructive-hover',
      },
      size: {
        default: 'h-7 px-3 has-[>svg]:px-2.5',
        // pt-px corrects the system-ui ascent/descent asymmetry — at 11px
        // the visible cap sits ~1px above the line-box center, which reads
        // wrong on a 24px control. Other sizes hit it less and don't need it.
        sm: 'h-6 px-2 pt-px text-sm has-[>svg]:px-1.5',
        xs: "h-5 px-1.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        icon: 'size-7',
        'icon-sm': 'size-6',
        'icon-xs': "size-5 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonVariant = NonNullable<ButtonVariantProps['variant']>
export type ButtonSize = NonNullable<ButtonVariantProps['size']>

export type ButtonProps = Omit<ComponentProps<'button'>, 'aria-pressed'> &
  ButtonVariantProps & {
    asChild?: boolean
    /** Toggle state. When defined, surfaces as `aria-pressed`; `true` also triggers the DS pressed styling. */
    pressed?: boolean
  }

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  pressed,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-pressed={pressed}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
