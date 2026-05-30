// FORKED from @/components/ui/input at shadcn 2026-04-30.
//
// Pattern 3 (see docs/ui-primitives.md). The DS calls for a 28px control on
// the elevated surface — too far from the shadcn default (36px, transparent
// surface) to express as a wrapper.
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

// DS input control tokens, shared so other input-shaped controls (e.g.
// NumberInput, which puts a borderless input inside its own bordered
// container) stay in lockstep with this fork instead of copy-pasting them.
// The focus recipe stays inline below because the variant prefix differs per
// element (this is the input → `focus:`/`focus-visible:`; a container that
// wraps the input uses `focus-within:`/`has-[:focus-visible]:`), and Tailwind
// only scans literal class names.
export const INPUT_SURFACE_CLASSES = 'h-7 rounded-md border border-border bg-input px-2'
export const INPUT_TEXT_CLASSES = 'text-md text-foreground tabular-nums'

const BASE_CLASSES = cn(
  INPUT_SURFACE_CLASSES,
  'w-full min-w-0 py-0',
  INPUT_TEXT_CLASSES,
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
