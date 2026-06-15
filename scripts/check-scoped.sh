#!/usr/bin/env bash
# Fast inner-loop check for a known set of changed files.
#
# This is NOT a replacement for `pnpm check` — it is the iteration loop.
# It deliberately skips `tsc` (whole-program; the LSP `<new-diagnostics>`
# push already surfaces new type errors after every edit) and runs only the
# tests related to the given files. Run the full `pnpm check` before committing.
#
# Usage:
#   pnpm check:scoped <file> [<file> ...]   # explicit set (agent knows its edits)
#   pnpm check:scoped                       # auto: tracked changes + untracked
set -euo pipefail

cd "$(dirname "$0")/.."

files=()
if [ "$#" -gt 0 ]; then
  files=("$@")
else
  # Modified/staged vs HEAD plus untracked, excluding deletions.
  # Portable to bash 3.2 (no mapfile/readarray).
  while IFS= read -r line; do
    [ -n "$line" ] && files+=("$line")
  done < <(
    { git diff --name-only --diff-filter=d HEAD; git ls-files --others --exclude-standard; } | sort -u
  )
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "check:scoped — no changed files, nothing to do."
  exit 0
fi

# ts/tsx subset drives ESLint + Vitest; Prettier formats everything it knows.
ts_files=()
for f in "${files[@]}"; do
  [ -f "$f" ] || continue
  case "$f" in
    *.ts|*.tsx) ts_files+=("$f") ;;
  esac
done

echo "check:scoped — ${#files[@]} file(s), ${#ts_files[@]} TS file(s)"

echo "› prettier"
pnpm exec prettier --check --cache --ignore-unknown "${files[@]}"

if [ "${#ts_files[@]}" -gt 0 ]; then
  echo "› eslint"
  pnpm exec eslint --cache --cache-location node_modules/.cache/eslint/ "${ts_files[@]}"

  echo "› vitest related"
  pnpm exec vitest related --run --project unit "${ts_files[@]}"
else
  echo "› eslint / vitest skipped (no TS files)"
fi

echo "check:scoped ✓  — run full \`pnpm check\` before committing."
