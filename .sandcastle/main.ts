import { claudeCustom } from './agent.ts'
import { runOrchestrator } from './lib/index.ts'
import { buildSandboxHooks, sandbox } from './sandbox.ts'

const seedIssue = Number(process.argv[2])
if (!Number.isInteger(seedIssue) || seedIssue <= 0) {
  console.error('Usage: pnpm sandcastle <issue-number>')
  process.exit(2)
}

const result = await runOrchestrator({
  seedIssue,
  sandbox,
  hooks: buildSandboxHooks,
  logDir: '.sandcastle/logs',
  stages: {
    implement: {
      agent: claudeCustom('claude-opus-4-6'),
      promptFile: './.sandcastle/prompts/implement.md',
      idleTimeoutSeconds: 1200,
    },
    review: {
      agent: claudeCustom('claude-opus-4-6'),
      promptFile: './.sandcastle/prompts/review.md',
      idleTimeoutSeconds: 900,
    },
    merge: {
      agent: claudeCustom('claude-opus-4-6'),
      promptFile: './.sandcastle/prompts/merge.md',
    },
  },
})

process.exit(result.tag === 'done' ? 0 : 1)
