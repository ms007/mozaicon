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
