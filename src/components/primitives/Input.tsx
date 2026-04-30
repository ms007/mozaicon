// FORKED from @/components/ui/input at shadcn 2026-04-30.
//
// Pattern 3 (see docs/ui-primitives.md). The DS calls for a 28px control on
// the elevated surface with mono numerics — too far from the shadcn default
// (36px, transparent surface, sans body-text) to express as a wrapper.
//
// Focus follows the DS spec literally rather than the shadcn ring idiom:
//   :focus           → border-color: var(--ring)               (== --primary)
//   :focus-visible   → outline 2px solid var(--ring), offset 2 (== --primary)
// Tailwind v4 quirk: `outline-hidden` (which replaces v3 `outline-none`)
// emits `outline-style: none` outside forced-colors mode — it does NOT
// pre-load a transparent 2px outline the way v3 did. Recoloring alone at
// `:focus-visible` paints nothing because the style is `none`. So every
// outline property has to be set explicitly: solid, 2, ring, offset-2.

import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const BASE_CLASSES = cn(
  'h-7 w-full min-w-0 rounded-md border border-border bg-input px-2 py-0',
  'text-md text-foreground font-mono tabular-nums',
  'outline-hidden transition-colors',
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'focus:border-ring',
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
  'aria-invalid:border-destructive',
)

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn(BASE_CLASSES, className)} {...props} />
}
