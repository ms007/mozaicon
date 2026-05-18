/**
 * Project-specific Claude Code agent provider that injects the system prompt
 * from `.sandcastle/prompts/system.md` via `wrapAgentProvider`. The file is
 * read once at module load and reused across all stage invocations.
 *
 * The path is resolved relative to the current working directory; this assumes
 * the script is launched from the project root (which `pnpm sandcastle` guarantees).
 */
import { readFileSync } from 'node:fs'
import * as sandcastle from '@ai-hero/sandcastle'
import { wrapAgentProvider } from './lib/index.ts'

const SYSTEM_PROMPT_PATH = './.sandcastle/prompts/system.md'

const systemPrompt = readFileSync(SYSTEM_PROMPT_PATH, 'utf8')

// Always-on env for every stage. ENABLE_LSP_TOOL=1 lights up Claude Code's
// LSP tool and the <new-diagnostics> push reminder; the matching binary
// (typescript-language-server) and plugin (typescript-lsp) are baked into
// .sandcastle/Dockerfile. Caller-supplied env wins on key conflicts.
const DEFAULT_AGENT_ENV: Record<string, string> = {
  ENABLE_LSP_TOOL: '1',
}

export const claudeCustom = (
  model: string,
  options?: sandcastle.ClaudeCodeOptions,
): sandcastle.AgentProvider =>
  wrapAgentProvider(
    sandcastle.claudeCode(model, {
      ...options,
      env: { ...DEFAULT_AGENT_ENV, ...options?.env },
    }),
    systemPrompt,
  )
