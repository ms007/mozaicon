---
description: Run a full health check on the repo and report findings
allowed-tools: Read, Glob, Grep, Bash(npm run check), Bash(npm run test:e2e), Bash(git status), Bash(git log:*), Bash(git diff:*)
---

# Health Check

Run a full health check on the repo and report findings.

## Task

Execute in order and report the result of each:

1. `npm run check` — types + lint + unit tests
2. `npm run test:e2e` — end-to-end tests (skip if it requires a manual dev server; note that instead)
3. `git status` — any uncommitted changes?
4. `git log --oneline -10` — recent commits context

## Analysis

After running, answer:

- **Passing?** Which steps passed, which failed?
- **Failures:** For each failure, identify the root cause file(s). Don't just paste the error.
- **Warnings:** Any ESLint warnings that should become errors? Any `@ts-ignore` or `as any` in the diff?
- **Test coverage gaps:** Any new code in recent commits that lacks tests? (Check `git diff` against `main`.)
- **Docs drift:** Do `CLAUDE.md` and the `docs/*.md` deep-dives still match the code? Flag obvious mismatches.

## Rules

- **Do not fix anything in this task.** Just report.
- If a failure is trivial (e.g., formatting), mention it but don't auto-fix — I'll decide.
- If something looks fine, say so briefly. Don't pad the report.

## Report format

```
## Health Check

### Commands
- `npm run check`: PASS / FAIL (details)
- `npm run test:e2e`: PASS / FAIL / SKIPPED (why)

### Findings
(bullet list, highest-priority first)

### Recommendations
(1-3 next steps, in priority order)
```
