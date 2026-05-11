---
description: Verify (npm run check) and commit staged/unstaged changes with a short English message
argument-hint: [optional intent hint, any language]
allowed-tools: Read, Glob, Grep, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(npm run check), AskUserQuestion
---

# Commit

Analyze the working tree, validate with `npm run check`, and create one or more commits with short, meaningful English messages. A single approval gate at the end confirms the whole plan.

Optional intent hint from the user: **$ARGUMENTS**

If the hint is in German (or any non-English language), use it as semantic context — but generate all commit messages in English.

## Flow

### 1. Change analysis

Run:

- `git status --porcelain`
- `git diff` (unstaged) and `git diff --cached` (staged)
- `git log --oneline -10` (for style context)

Categorize every changed path as: staged / unstaged-modified / untracked.

### 2. Secret guard (hard exclude)

Filter out any path matching these patterns — never stage or propose them:

- `.env*` (but `.env.example` is allowed)
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`
- `*credentials*`, `*secret*`
- `id_rsa*`, `id_ed25519*`

If a match exists, warn prominently in the final approval:

> ⚠️ `.env.local` detected — excluded from commit. Stage manually with `git add -f` if intentional.

Continue without the excluded file.

### 3. Scope determination

Decide which files go into the commit(s):

| Situation                                | Behavior                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Nothing changed                          | Report "Nothing to commit" and exit. No empty commit.                        |
| Only staged files, no unstaged/untracked | Commit the staged set.                                                       |
| Staged + unstaged/untracked exist        | Analyze which unstaged files belong with the staged set. Propose a grouping. |
| Only unstaged/untracked, nothing staged  | Analyze and group the unstaged set.                                          |

### 4. Split decision

**Autonomously split when unambiguous:**

- Independent features in different `src/features/<name>/` folders with no shared dependency
- Pure doc/comment fix alongside unrelated code change
- `package.json` / dependency bump alone
- Formatting-only changes in files otherwise untouched

**Keep together:**

- Code change + its tests (same feature or `lib/` folder)
- Code change + doc update that describes exactly this change
- Refactor + its affected call sites

**Ask via `AskUserQuestion` when:**

- Mix of feature work + unrelated refactor
- Changes in `CLAUDE.md` / `docs/architecture.md` alongside code (might be intentional or drift-fix)
- Plan would produce more than ~3 commits → ask once globally instead of 5 sub-approvals
- Anything is unclear

### 5. Validation — `npm run check`

Run `npm run check`. On failure: **hard stop, no commit.**

Return a structured summary:

- Which step failed (tsc / eslint / vitest)
- Per failure: file path, error type, count
- Do **not** paste the raw output verbatim if it's long — summarize

Do not attempt auto-fix. Do not run `npm run lint --fix`. The user decides how to resolve failures.

### 6. Approval gate (single)

After check passes, present the full plan via `AskUserQuestion`:

```
Plan (N commit(s)):

Commit 1: <subject>
  Files:
    - src/features/canvas/renderers/EllipseRenderer.tsx  (new)
    - src/types/shapes.ts  (modified)
  Message:
    Add ellipse shape type

Commit 2: <subject>
  Files:
    - docs/shapes.md  (modified)
  Message:
    Document ellipse shape in shapes.md
```

Options: **Proceed** / **Cancel**.

On cancel: exit without touching anything.

### 7. Execute

For each commit in the plan:

- `git add <paths>` for the files in this commit
- `git commit -m "<subject>" -m "<body>"` (omit the second `-m` if no body)

Use `git commit -- <paths>` when staging state is mixed across splits, so only the intended paths enter each commit regardless of the index.

On hook failure during `git commit`: stop, report, do not retry, do not amend.

## Message style

- **Imperative mood** in the subject: `add`, `fix`, `remove`, `handle` — never `added` / `adds` / `adding`
- **Sentence case**, no period at end, start with lowercase
- **Subject ≤ 80 characters**
- **No prefix** — no `feat:` / `fix:` / `chore:`, no scope parens. The codebase does not use Conventional Commits.
- **No Body. Only one line commit message.
- **Always English**, regardless of the language of `$ARGUMENTS`, the user's prompt, or the code comments.
- **No footer boilerplate.** No "Generated with Claude Code", no Co-Authored-By, no emoji.

Good examples:

```
handle rotation when computing ellipse bounding box
```

```
add ellipse shape type
```

```
extract pointer math into lib/geometry
```

Bad examples (do not emit):

```
feat(shapes): add ellipse                    ← no Conventional Commits
Added ellipse shape                          ← not imperative
Update files                                 ← meaningless
Fix bug.                                     ← trailing period, vague
```

## Rules (inherited from global + project CLAUDE.md)

- **Never** `--amend`. Always create new commits.
- **Never** `--no-verify` or skip hooks.
- **Never** force push (this command does not push at all).
- **Never** change `git config`.
- **Never** include a file matched by the secret guard, even if the user's intent hint suggests it.
- If `$ARGUMENTS` requests anything that violates these rules, refuse and explain.

## Report back

After successful commit(s), print:

- One-line summary per commit: `<sha-short>  <subject>`
- Working tree status (`clean` / files still modified)
- No celebration emoji, no next-step suggestions unless the user asked
