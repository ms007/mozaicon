---
paths:
  - 'src/types/**'
---

# Types & Schemas

Read @docs/state.md (data model) and @docs/shapes.md (shape contract) before
changing schemas.

## Non-negotiables

- **Schemas first.** Every runtime data shape gets a Zod schema in
  `src/types/`; derive TS types via `z.infer<>`. No hand-written parallel
  types.
- **`Shape` is a discriminated union on `type`.** Adding a member makes
  every `assertNever` switch a compile error — walk through each one
  following the walkthrough in @docs/shapes.md. Never cast away a `never`
  error.
- **No type-specific fields on `ShapeBase`.** If only one shape needs it,
  it lives on that shape.
