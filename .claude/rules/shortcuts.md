---
paths:
  - 'src/features/shortcuts/**'
---

# Keyboard Shortcuts

## Non-negotiables

- **Every shortcut goes through the registry**
  (`src/features/shortcuts/registry.ts`). No ad-hoc `keydown` listeners on
  `window` or components.
- **Escape is a priority ladder** with early return after the first matching
  tier (active gesture → active tool → selection). Never combine tiers in
  one press. See @docs/gestures.md § Cancellation & Escape Priority.
- **Overlay primitives intercept Escape locally** (e.g. the Color Picker
  popover) and must `stopPropagation()` so the `window`-level ladder is never
  reached — closing an overlay must not deactivate the tool or clear the
  selection. See @docs/gestures.md § Overlay Escape interception.
