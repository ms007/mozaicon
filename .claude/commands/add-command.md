---
description: Add a new undoable command to the store
argument-hint: <commandName>
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run check)
---

# Add Command: $ARGUMENTS

Add a new undoable command called `$ARGUMENTS` to the store.

## Before starting

Read:

1. @docs/commands.md — the command pattern (required)
2. @src/store/commands/createCommand.ts — the `createCommand` helper
3. @src/store/commands/moveSelection.ts — a reference implementation
4. @src/store/commands/moveSelection.test.ts — the testing pattern

## Task

1. Create the command in `src/store/commands/$ARGUMENTS.ts`
2. Use the `createCommand` helper — do NOT write a raw write-only atom
3. Keep the apply function pure: `(icon, payload, selection) => CommandResult`. No side effects.
4. Use Immer (`produce`) if the update touches nested fields
5. Write tests in the same folder covering:
   - Happy path (state changes as expected)
   - No-op case (e.g., unknown id, empty payload)
   - Undo stack receives an entry with the right label
   - Round-trip through undo/redo

## Rules

- **Never call `set(activeIconAtom, ...)` from a component.** Commands are the only path.
- **Don't add side effects inside `apply`.** If you need them, use a separate effect atom.
- **The label string is user-visible** (shown in undo history UI). Make it a clean verb phrase like "Move shape" or "Change fill".
- Run `npm run check` before reporting done.

## Report back

- The command's file path and label
- What payload shape it takes
- Test coverage summary
- Any atoms you had to add or modify
